/* eslint-disable no-unused-vars */
/* eslint-disable radix */
/* eslint-disable no-param-reassign */
/* eslint-disable one-var */
/* eslint-disable no-continue */
'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Handle Extend add to cart
 * @param {dw.order.Basket} currentBasket - current basket
 * @param {dw.catalog.Product} product - product
 * @param {dw.order.ProductLineItem} parentLineItem - parent line item
 * @param {Object} form - form
 */
function addExtendWarrantyToCart(currentBasket, product, parentLineItem, form) {
    var Transaction = require('dw/system/Transaction');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var warrantyLi;

    if (!currentBasket) {
        return;
    }

    // Add new line item for the Extend warranty
    Transaction.wrap(function () {
        warrantyLi = cartHelper.addLineItem(
            currentBasket,
            product,
            parseInt(form.quantity, 10),
            [],
            product.getOptionModel(),
            currentBasket.getDefaultShipment()
        );
    });

    // Configure the Extend ProductLineItem
    Transaction.wrap(function () {
        warrantyLi.setProductName('Extend Product Protection: ' + parseInt(form.extendTerm / 12) + ' years for ' + form.parentId);
        warrantyLi.setManufacturerSKU(form.extendPlanId);
        warrantyLi.setPriceValue(parseFloat(form.extendPrice) / 100);
        warrantyLi.setQuantityValue(parseInt(form.quantity, 10));
        if (parentLineItem) {
            warrantyLi.custom.parentLineItemUUID = parentLineItem.UUID;
            warrantyLi.custom.persistentUUID = warrantyLi.UUID;
            parentLineItem.custom.persistentUUID = parentLineItem.UUID;
        } else {
            warrantyLi.custom.isWarranty = true;
        }
    });
}

/**
 * Warranty-ShowOffers : This endpoint is called to show offers for product
 */
server.get('ShowOffers', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var data = req.querystring;
    var token = data.token;
    var productId = data.pid;
    var order = OrderMgr.getOrder(data.orderID);

    if (!order) {
        return next();
    }

    if (!token) {
        return next();
    }

    var pLItems = order.defaultShipment.productLineItems;
    var pLi = null;
    var qty = null;

    for (var i = 0; i < pLItems.length; i += 1) {
        pLi = pLItems[i];
        if (pLi.productID !== productId) {
            continue;
        }
        if (!pLi.custom.leadToken) {
            continue;
        }
        if (pLi.custom.leadToken !== token) {
            continue;
        }
        qty = pLi.quantity;
    }

    var pid = {
        pid: productId
    };
    var showProductPageHelperResult = productHelper.showProductPage(pid, req.pageMetaData);
    showProductPageHelperResult.template = 'warranty/productDetails';

    // display the quantity of product
    var productQty = showProductPageHelperResult.product.quantities;
    for (var k = 0; k < productQty.length; k += 1) {
        if (parseInt(productQty[k].value) === qty.value) {
            productQty[k].selected = true;
            break;
        }
    }

    var productType = showProductPageHelperResult.product.productType;
    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        var pageLookupResult = productHelper.getPageDesignerProductPage(showProductPageHelperResult.product);

        if ((pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) || pageLookupResult.invisiblePage) {
            // the result may be different for another user, do not cache on this level
            // the page itself is a remote include and can still be cached
            res.cachePeriod = 0; // eslint-disable-line no-param-reassign
        }
        if (pageLookupResult.page) {
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        } else {
            res.render(showProductPageHelperResult.template, {
                product: showProductPageHelperResult.product,
                addToCartUrl: showProductPageHelperResult.addToCartUrl,
                resources: showProductPageHelperResult.resources,
                breadcrumbs: showProductPageHelperResult.breadcrumbs,
                canonicalUrl: showProductPageHelperResult.canonicalUrl,
                schemaData: showProductPageHelperResult.schemaData,
                isIncludeProduct: data.pskip
            });
        }
    }
    return next();
}, pageMetaData.computedPageMetaData);

/**
 * Warranty-AddWarranty : This endpoint is called to add warranty to cart
 */
server.post('AddWarranty', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    if (!currentBasket) {
        return next();
    }

    var form = req.form;

    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var product = ProductMgr.getProduct('EXTEND-' + form.extendTerm);
    addExtendWarrantyToCart(currentBasket, product, null, form);

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);

    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    var cartModel = new CartModel(currentBasket);
    res.json({
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        error: result.error,
        minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    });
    return next();
});


module.exports = server.exports();
