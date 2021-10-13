/* eslint-disable no-unused-vars */
/* eslint-disable one-var */
/* eslint-disable block-scoped-var */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
'use strict';

/**
 * Controller that adds extra functionality.
 * @module controllers/Extend
 */

/* API Includes */
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');

/* EXTEND */
var extendHelpers = require('*/cartridge/scripts/extendHelpers');

/**
 * Check productId against the Extend API Offer endpoint
 * This is used in cart to asynchronously enable up-sell modal
 */
function isEligibleForWarranty() {
    var BasketMgr = require('dw/order/BasketMgr');
    var qs = request.httpParameters;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var pid,
        qty;
    var response = require('*/cartridge/scripts/util/Response');

    // Query string parameter wasn't provided
    if (!qs.uuid[0]) {
        response.renderJSON({
            isEligible: false
        });
        return;
    }

    // Check if there's already an Extend product attached to this line item or current product is Extend Product
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].custom.parentLineItemUUID === qs.uuid[0] || (!empty(currentBasket.productLineItems[i].custom.parentLineItemUUID) && currentBasket.productLineItems[i].getUUID() === qs.uuid[0])) {
            response.renderJSON({
                isEligible: false
            });
            return;
        }
    }

    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].UUID === qs.uuid[0]) {
            pid = currentBasket.productLineItems[i].productID;
            qty = currentBasket.productLineItems[i].quantityValue;
            break;
        }
    }

    // No line item with the provided UUID was found in current basket
    if (!pid) {
        response.renderJSON({
            isEligible: false
        });
        return;
    }

    response.renderJSON({
        isEligible: true,
        pid: pid,
        qty: qty
    });
}


/**
 * Handle Extend products when adding to cart from up-sell modal
 */
function addExtendProduct() {
    var response = require('*/cartridge/scripts/util/Response');
    var ProductModel = app.getModel('Product');
    var cart = app.getModel('Cart').goc();
    var currentBasket = cart.object;
    var params = request.httpParameterMap;

    if (!currentBasket) {
        response.setStatusCode(500);
        response.renderJSON({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return;
    }

    extendHelpers.createOrUpdateExtendLineItem(cart, params, ProductModel);

    Transaction.wrap(function () {
        cart.calculate();
    });

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
/** Checks if a product is eligible for warranty.
 * @see {@link module:controllers/Extend~isEligibleForWarranty} */
exports.IsEligibleForWarranty = guard.ensure(['get', 'https'], isEligibleForWarranty);

/** Adds Exend warranty product to cart.
 * @see {@link module:controllers/Extend~addExtendProduct} */
exports.AddExtendProduct = guard.ensure(['post', 'https'], addExtendProduct);
