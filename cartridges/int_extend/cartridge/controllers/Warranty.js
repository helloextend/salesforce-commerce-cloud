/* eslint-disable no-continue */
/* eslint-disable no-undef */
'use strict';

/**
 * Controller that adds extra functionality.
 * @module controllers/Warranty
 */

var params = request.httpParameterMap;

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var meta = require('*/cartridge/scripts/meta');

/* EXTEND */
var extendHelpers = require('*/cartridge/scripts/extendHelpers');

/**
 * Warranty-ShowOffers : This endpoint is called to show offers for product
 */
function showOffers() {
    var Product = app.getModel('Product');

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

    if (product.isVisible()) {
        meta.update(product);
        meta.updatePageMetaTags(product);
        app.getView('Product', {
            product: product,
            quantity: qty
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
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    if (!currentBasket) {
        return;
    }
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
