/* eslint-disable radix */
/* eslint-disable no-continue */
/* eslint-disable no-undef */
'use strict';

/**
 * Controller that adds extra functionality.
 * @module controllers/Warranty
 */


/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var meta = require('*/cartridge/scripts/meta');
var response = require('*/cartridge/scripts/util/Response');

/**
* Adds Extend warranty product line items to cart
*
* @transactional
* @param {Object} cart The Cart model
* @param {Object} params The params object
* @param {Object} Product Product model
*/
function createExtendLineItem(cart, params, Product) {
    var Transaction = require('dw/system/Transaction');

    if (params.extendPlanId.isEmpty() || params.extendPrice.isEmpty() || params.extendTerm.isEmpty()) {
        return;
    }

    var currentBasket = cart.object;
    var quantity = params.quantity.doubleValue || params.Quantity.doubleValue;
    var warrantyLi;

    // Configure the Extend ProductLineItem
    var productModel = Product.get('EXTEND-' + params.extendTerm);
    var shipment = currentBasket.defaultShipment;
    var productToAdd = productModel.object;
    var productOptionModel = productModel.updateOptionSelection(params);

    Transaction.wrap(function () {
        warrantyLi = cart.createProductLineItem(productToAdd, productOptionModel, shipment);

        // Configure the Extend ProductLineItem
        warrantyLi.setProductName('Extend Product Protection: ' + parseInt(params.extendTerm / 12) + ' years for ' + params.extendParentId);
        warrantyLi.setLineItemText('Extend Product Protection: ' + parseInt(params.extendTerm / 12) + ' years for ' + params.extendParentId);
        warrantyLi.setManufacturerSKU(params.extendPlanId);
        warrantyLi.setPriceValue(parseInt(params.extendPrice, 10) / 100);
        warrantyLi.setQuantityValue(parseInt(quantity, 10));
        warrantyLi.custom.parentLineItemUUID = params.extendParentId;
        warrantyLi.custom.isWarranty = true;

        cart.calculate();
    });
}

/**
 * Warranty-ShowOffers : This endpoint is called to show offers for product
 */
function showOffers() {
    var Product = app.getModel('Product');
    var URLUtils = require('dw/web/URLUtils');

    var params = request.httpParameterMap;

    var order = OrderMgr.getOrder(params.orderID.stringValue);
    var productId = params.pid.stringValue;
    var token = params.token.stringValue;

    if (!order) {
        response.setStatus(410);
        app.getView().render('error/notfound');
        return;
    }

    if (!token) {
        response.setStatus(410);
        app.getView().render('error/notfound');
        return;
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

    var product = Product.get(params.pid.stringValue);

    var actionUrls = {
        addWarranty: URLUtils.url('Warranty-AddWarranty').toString(),
        continueCartUrl: URLUtils.url('Cart-Show').toString()
    };

    if (product.isVisible()) {
        meta.update(product);
        meta.updatePageMetaTags(product);
        app.getView('Product', {
            product: product,
            quantity: qty,
            actionUrls: actionUrls
        }).render('warranty/product');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }
}

/**
 * Warranty-AddWarranty : This endpoint is called to add offers to cart
 */
function addWarranty() {
    var cart = app.getModel('Cart').goc();

    var params = request.httpParameterMap;

    var ProductModel = app.getModel('Product');
    createExtendLineItem(cart, params, ProductModel);

    var updatedBasket = app.getModel('Cart').get();

    response.renderJSON(updatedBasket);
    return;
}

/*
* Module exports
*/

/*
* Exposed methods.
*/
/** Show offers via PDP.
* @see {@link module:controllers/Warranty~showOffers} */
exports.ShowOffers = guard.ensure(['get', 'https'], showOffers);
/** Add offers to cart.
* @see {@link module:controllers/Warranty~addWarranty} */
exports.AddWarranty = guard.ensure(['post', 'https'], addWarranty);
