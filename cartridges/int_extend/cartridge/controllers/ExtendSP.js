/* eslint-disable no-useless-concat */
/* eslint-disable radix */
/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable one-var */
/* eslint-disable block-scoped-var */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
'use strict';

/**
 * Controller that adds extra functionality to work with Extend Shipping Protection
 * @module controllers/ExtendSP
 */

/* API Includes */
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var collections = require('*/cartridge/scripts/util/collections');

/* EXTEND HELPERS*/
var extendHelpers = require('*/cartridge/scripts/extendHelpers');

/* Create API call and process responses */
var extendProcessAPIHelpers = require('*/cartridge/scripts/extend');

/* EXTEND SHIPPING PROTECTION HELPERS */
var extendShippingProtectionHelpers = require('*/cartridge/scripts/extendShippingProtectionHelpers');

/* Check the current API version */
var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;

/* Check does Extend shipping protection switche status*/
var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

/* The variables used in each function */
var response = require('*/cartridge/scripts/util/Response');
var cart = app.getModel('Cart').goc();

/**
 * Create Extend Shipping Protection Quotes. Make a call to Shipping API.
 */
function shippingProtectionCreateQuotes() {
    var currentBasket = cart.object;

    if (!currentBasket) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var storeID = Site.getCurrent().getCustomPreferenceValue('extendStoreID');

        var products = [];

        products = extendShippingProtectionHelpers.getProductToCreateQuotes(currentBasket);

        var createsShippingOfferQuotes = extendProcessAPIHelpers.createsShippingOfferQutes(storeID, products);

        var cartItems = createsShippingOfferQuotes.items;
        var shippingOfferQuotes = createsShippingOfferQuotes.response;

        var shippingProtectionLineItem = null;

        var allLineItems = currentBasket.getAllProductLineItems();
        collections.forEach(allLineItems, function (productLineItem) {
            if (productLineItem.custom.isExtendShippingProtection) {
                shippingProtectionLineItem = productLineItem;
            }
        });

        if (shippingProtectionLineItem) {
            // Add quotes info to order info to create a shipping protection plan line item
            Transaction.wrap(function () {
                shippingProtectionLineItem.custom.extendShippingQuoteId = shippingOfferQuotes.id;
            });
        }

        var basket = app.getModel('Cart').get();

        response.renderJSON({
            cartItems: cartItems,
            cart: basket
        });
    }

    return;
}

/**
 * Check does shipping protection is in the cart
 */
function doesShippingProtectionExists() {
    var currentBasket = cart.object;

    if (!currentBasket) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var isShippingProtectionInCart = false;

        var allLineItems = currentBasket.getAllProductLineItems();
        collections.forEach(allLineItems, function (productLineItem) {
            if (productLineItem.custom.isExtendShippingProtection) {
                isShippingProtectionInCart = true;
            }
        });

        response.renderJSON({
            isShippingProtectionInCart: isShippingProtectionInCart
        });
    }

    return;
}

/**
 * Add Extend Shipping Offer via cart
 */
function addExtendShippingOffer() {
    var currentBasket = cart.object;

    if (!currentBasket) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        extendShippingProtectionHelpers.createOrUpdateExtendShippingProtectionQuote(currentBasket);

        var basket = app.getModel('Cart').get();

        response.renderJSON({
            cart: basket
        });
    }

    return;
}

/**
 * Remove Shipping Protection from the cart
*/
function removeShippingProtection() {
    var currentBasket = cart.object;

    if (!currentBasket) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var isShippingProtectionFound = false;
        var shippingProtectionLineItem = null;

        Transaction.wrap(function () {
            var allLineItems = currentBasket.getAllProductLineItems();
            collections.forEach(allLineItems, function (productLineItem) {
                if (productLineItem.custom.isExtendShippingProtection) {
                    isShippingProtectionFound = true;
                    shippingProtectionLineItem = productLineItem;
                }
            });

            if (isShippingProtectionFound && shippingProtectionLineItem) {
                currentBasket.removeProductLineItem(shippingProtectionLineItem);
            }

            currentBasket.custom.isExtendShippingProtectionAdded = false;

            cart.calculate();
        });

        if (isShippingProtectionFound) {
            var basket = app.getModel('Cart').get();
            response.renderJSON({
                cart: basket
            });
        } else {
            response.setStatus(500);
        }
    }

    return;
}

/*
* Module exports
*/

/*
* Exposed methods.
*/

/** Create Extend Shipping Protection Quotes. Make a call to Shipping API.
 * @see {@link module:controllers/ExtendSP~shippingProtectionCreateQuotes} */
exports.ShippingProtectionCreateQuotes = guard.ensure(['post', 'https'], shippingProtectionCreateQuotes);

/** Check does shipping protection is in the cart.
 * @see {@link module:controllers/ExtendSP~doesShippingProtectionExists} */
exports.DoesShippingProtectionExists = guard.ensure(['get', 'https'], doesShippingProtectionExists);

/** Add Extend Shipping Offer via cart.
 * @see {@link module:controllers/ExtendSP~addExtendShippingOffer} */
exports.AddExtendShippingOffer = guard.ensure(['get', 'https'], addExtendShippingOffer);

/** Add Extend Shipping Offer via cart.
 * @see {@link module:controllers/ExtendSP~removeShippingProtection} */
exports.RemoveShippingProtection = guard.ensure(['get', 'https'], removeShippingProtection);

