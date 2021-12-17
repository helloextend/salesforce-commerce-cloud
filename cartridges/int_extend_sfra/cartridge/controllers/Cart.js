/* eslint-disable no-undef */
/* eslint-disable one-var */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable block-scoped-var */
/* eslint-disable radix */
/* eslint-disable no-param-reassign */
/* eslint-disable valid-jsdoc */
'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

/**
 *
 * @param {string} currentWarrantyLi - current warranty list
 * @param {Object} form - form
 */
function updateExtendWarranty(currentWarrantyLi, form) {
    var Transaction = require('dw/system/Transaction');
    var quantityInCart = currentWarrantyLi.getQuantity();

    Transaction.wrap(function () {
        currentWarrantyLi.setQuantityValue(quantityInCart + parseInt(form.quantity, 10));
    });
}

/**
 * Handle Extend add to cart
 * @param {dw.order.Basket} currentBasket
 * @param {dw.catalog.Product} product
 * @param {dw.order.ProductLineItem} parentLineItem
 * @param {Object} form
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
        warrantyLi.setProductName('Extend Product Protection: ' + parseInt(form.extendTerm / 12) + ' years for ' + parentLineItem.productName);
        warrantyLi.setManufacturerSKU(form.extendPlanId);
        warrantyLi.setPriceValue(parseFloat(form.extendPrice) / 100);
        warrantyLi.setQuantityValue(parseInt(form.quantity, 10));
        warrantyLi.custom.parentLineItemUUID = parentLineItem.UUID;
        warrantyLi.custom.persistentUUID = warrantyLi.UUID;
        parentLineItem.custom.persistentUUID = parentLineItem.UUID;
    });
}

/**
 * Handle Extend products when adding regular product to cart
 */
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var extendHelpers = require('~/cartridge/scripts/helpers/extendHelpers');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var form = req.form;
    var viewData = res.getViewData(); // pliUUID

    var isOfferValide = extendHelpers.validateOffer(form);

    if (isOfferValide && form.extendPlanId && form.extendPrice && form.extendTerm && !req.form.pidsObj) {
        var product = ProductMgr.getProduct('EXTEND-' + form.extendTerm);
        var parentLineItem;

        // Determine the parent product for the current Extend warranty product
        for (var i = 0; i < currentBasket.productLineItems.length; i++) {
            if (currentBasket.productLineItems[i].UUID === viewData.pliUUID) {
                parentLineItem = currentBasket.productLineItems[i];
                break;
            }
        }

        // Determine whether warranty line item already exists for this product line item
        var currentWarrantyLi;
        var warrantyLis = currentBasket.getProductLineItems('EXTEND-' + form.extendTerm);
        for (var i = 0; i < warrantyLis.length; i++) {
            if (warrantyLis[i].custom.parentLineItemUUID === parentLineItem.UUID) {
                currentWarrantyLi = warrantyLis[i];
                break;
            }
        }

        if (currentWarrantyLi) {
            updateExtendWarranty(currentWarrantyLi, form);
        } else {
            addExtendWarrantyToCart(currentBasket, product, parentLineItem, form);
        }

        // Update totalQuantity with quantity of Extend warranties that's been added to cart
        res.setViewData({
            quantityTotal: viewData.quantityTotal + parseInt(form.quantity, 10)
        });
    }

    return next();
});

/**
 * Check productId already have an extend product associated
 * This is used in cart to asynchronously enable up-sell modal
 */
server.get('DoesWarrantyExists', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var qs = req.querystring;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var pid,
        qty,
        lead;

    // Query string parameter wasn't provided
    if (!qs.uuid) {
        res.json({
            isEligible: false
        });

        next();
        return;
    }

    // Check if there's already an Extend product attached to this line item or current product is Extend Product
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].custom.parentLineItemUUID === qs.uuid || (!empty(currentBasket.productLineItems[i].custom.parentLineItemUUID) && currentBasket.productLineItems[i].getUUID() === qs.uuid)) {
            res.json({
                isEligible: false
            });

            next();
            return;
        }
    }

    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].UUID === qs.uuid) {
            pid = currentBasket.productLineItems[i].productID;
            qty = currentBasket.productLineItems[i].quantityValue;
            lead = currentBasket.productLineItems[i];
            break;
        }
    }

    // No line item with the provided UUID was found in current basket
    if (!pid) {
        res.json({
            isEligible: false
        });

        next();
        return;
    }

    Transaction.wrap(function () {
        lead.custom.isWarrantable = true;
    });

    res.json({
        isEligible: true,
        pid: pid,
        qty: qty
    });

    next();
});

/**
 * Handle Extend products when adding to cart from up-sell modal
 */
server.post('AddExtendProduct', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var extendHelpers = require('~/cartridge/scripts/helpers/extendHelpers');

    var form = req.form;
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isOfferValide = extendHelpers.validateOffer(form);

    if (!isOfferValide) {
        res.json({
            error: true
        });

        return next();
    }

    var product = ProductMgr.getProduct('EXTEND-' + form.extendTerm);
    var parentLineItem;

    // Determine the parent product for the current Extend warranty product
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].UUID === form.pliUUID) {
            parentLineItem = currentBasket.productLineItems[i];
            break;
        }
    }

    addExtendWarrantyToCart(currentBasket, product, parentLineItem, form);

    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var basketModel = new CartModel(currentBasket);

    res.json(basketModel);
    return next();
});


/**
 * Handle deletion of Extend parent line item
 */
server.append('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket || !req.querystring.pid || !req.querystring.uuid) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isProductLineItemFound = false;
    var extendProductsUUIDs = [];

    Transaction.wrap(function () {
        var productLineItems = currentBasket.getAllProductLineItems();

        for (var i = 0; i < productLineItems.length; i++) {
            var item = productLineItems[i];
            if ((item.custom.parentLineItemUUID === req.querystring.uuid)) {
                var shipmentToRemove = item.shipment;
                currentBasket.removeProductLineItem(item);
                extendProductsUUIDs.push(item.UUID);
                isProductLineItemFound = true;
                if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                    currentBasket.removeShipment(shipmentToRemove);
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var basketModel = new CartModel(currentBasket);
    if (isProductLineItemFound) {
        res.json({
            basket: basketModel,
            toBeDeletedUUIDs: extendProductsUUIDs
        });
    } else {
        res.json({
            basket: basketModel
        });
    }

    return next();
});

/**
 * ExtendAnalytics
 */
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var extendAnalyticsHelpers = require('*/cartridge/scripts/helpers/extendAnalyticsHelpers');

    var analyticsSDK = Site.getCurrent().getCustomPreferenceValue('extendAnalyticsSwitch');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var form = req.form;

    if (!analyticsSDK || !currentBasket || !form.pid) {
        return next();
    }

    var addedProduct;
    var productLineItems = currentBasket.getAllProductLineItems(form.pid);

    if (productLineItems.length === 0) {
        return next();
    }

    for (var i = 0; i < productLineItems.length; i++) {
        if (productLineItems[i].productID === form.pid) {
            addedProduct = productLineItems[i];
        }
    }

    if (!addedProduct) {
        return next();
    }

    var extendProduct = extendAnalyticsHelpers.getExtendProduct(currentBasket, addedProduct);

    if (!form.extendPlanId) {
        viewData.extendAnalytics = extendAnalyticsHelpers.getProductAddedToCartData(addedProduct, form);
    } else if (form.extendPlanId) {
        viewData.extendAnalytics = extendAnalyticsHelpers.getOfferAddedToCartData(addedProduct, form);
    }

    res.setViewData(viewData);
    return next();
});

/**
 * Add tracking of removing plans and products from cart
 */
server.prepend('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var extendAnalyticsHelpers = require('*/cartridge/scripts/helpers/extendAnalyticsHelpers');

    var analyticsSDK = Site.getCurrent().getCustomPreferenceValue('extendAnalyticsSwitch');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var productId = req.querystring.pid;
    var uuid = req.querystring.uuid;

    if (!analyticsSDK || !productId || !uuid) {
        return next();
    }

    var removedProduct;
    var removedExtendPlan;
    var productLineItems = currentBasket.getAllProductLineItems(productId);

    for (var i = 0; i < productLineItems.length; i++) {
        if (extendAnalyticsHelpers.isExtendProduct(productLineItems[i], uuid)) {
            removedExtendPlan = productLineItems[i];
        } else {
            removedProduct = productLineItems[i];
        }
    }

    if (removedProduct) {
        if (removedProduct.custom.persistentUUID) {
            var extendProduct = extendAnalyticsHelpers.getExtendProduct(currentBasket, removedProduct);

            if (extendProduct) {
                return next();
            }
        }
        viewData.extendAnalytics = extendAnalyticsHelpers.getProductRemovedFromCartData(removedProduct);
    } else if (removedExtendPlan) {
        var removedExtendedProduct = extendAnalyticsHelpers.getExtendedProduct(currentBasket, removedExtendPlan);
        viewData.extendAnalytics = extendAnalyticsHelpers.getOfferRemovedFromCartData(removedExtendedProduct, removedExtendPlan);
    }
    res.setViewData(viewData);

    return next();
});

/**
 * Add tracking of updating plans and products quantity
 */
server.append('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var extendAnalyticsHelpers = require('*/cartridge/scripts/helpers/extendAnalyticsHelpers');

    var analyticsSDK = Site.getCurrent().getCustomPreferenceValue('extendAnalyticsSwitch');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();

    if (!analyticsSDK || !viewData.items) {
        return next();
    }

    if (currentBasket) {
        var productId = req.querystring.pid;
        var uuid = req.querystring.uuid;
        var updatedProduct;
        var updatedExtendPlan;
        var productLineItems = currentBasket.getAllProductLineItems(productId);

        if (productLineItems.length === 0) {
            return next();
        }

        for (var i = 0; i < productLineItems.length; i++) {
            if (extendAnalyticsHelpers.isExtendProduct(productLineItems[i], uuid)) {
                updatedExtendPlan = productLineItems[i];
            } else {
                updatedProduct = productLineItems[i];
            }
        }

        if (updatedProduct) {
            if (updatedProduct.custom.persistentUUID) {
                var extendProduct = extendAnalyticsHelpers.getExtendProduct(currentBasket, updatedProduct);

                if (extendProduct) {
                    viewData.extendAnalytics = extendAnalyticsHelpers.getOfferUpdatedData(updatedProduct, extendProduct);
                } else {
                    viewData.extendAnalytics = extendAnalyticsHelpers.getProductUpdatedData(updatedProduct);
                }
            } else {
                viewData.extendAnalytics = extendAnalyticsHelpers.getProductUpdatedData(updatedProduct);
            }
        } else if (updatedExtendPlan) {
            var updatedExtendedProduct = extendAnalyticsHelpers.getExtendedProduct(currentBasket, updatedExtendPlan);
            viewData.extendAnalytics = extendAnalyticsHelpers.getOfferUpdatedData(updatedExtendedProduct, updatedExtendPlan);
        }
        res.setViewData(viewData);
    }
    return next();
});

module.exports = server.exports();
