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

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');
var collections = require('*/cartridge/scripts/util/collections');

/* API Includes */
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var Product = app.getModel('Product');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');

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
 * Get the Extend Shipping Protection Config.
 * Return the ESP default behaviour:
 */
function getConfig() {
    var currentBasket = cart.object;

    if (!currentBasket) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        try {
            var extendShippingProtectionConfig = extendProcessAPIHelpers.getExtendShippingProtectionConfig();
            var attachBehavior = extendShippingProtectionConfig.config.attachBehavior;

            Transaction.wrap(function () {
                currentBasket.custom.extendShippingProtectionAttachBehaviour = attachBehavior;
            });

            extendShippingProtectionHelpers.processExtendShippingProtectionConfig(cart, attachBehavior);

            response.renderJSON({
                attachBehavior: attachBehavior
            });
        } catch (error) {
            logger.error('Failed to receive Extend Shipping Protection config. {0}', error);
        }
    }

    return;
}

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

        var attachBehavior = currentBasket.custom.extendShippingProtectionAttachBehaviour;

        var isExtendShippingProtectionAttend = extendShippingProtectionHelpers.isExtendShippingProtectionAttend(currentBasket);

        // Determine whether the product is lead
        var isLead = extendShippingProtectionHelpers.isProductLineItemLead(currentBasket);

        isExtendShippingProtectionAttend = isExtendShippingProtectionAttend || isLead;

        var isExtendShippingProtectionAdded = currentBasket.custom.isExtendShippingProtectionAdded;
        var isExtendShippingProtectionRemoved = currentBasket.custom.isExtendShippingProtectionRemoved;

        if (shippingProtectionLineItem) {
            // Add quotes info to order info to create a shipping protection plan line item
            Transaction.wrap(function () {
                shippingProtectionLineItem.custom.extendShippingQuoteId = shippingOfferQuotes.id;

                cart.calculate();
            });
        }

        var basket = app.getModel('Cart').get();

        response.renderJSON({
            cartItems: cartItems,
            attachBehavior: attachBehavior,
            isExtendShippingProtectionAttend: isExtendShippingProtectionAttend,
            isExtendShippingProtectionAdded: isExtendShippingProtectionAdded,
            isExtendShippingProtectionRemoved: isExtendShippingProtectionRemoved,
            cart: basket
        });
    }

    return;
}

/**
 * Add Extend Shipping Offer via cart
 */
function addExtendShippingOffer() {
    if (!cart) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var params = request.httpParameterMap;

        extendShippingProtectionHelpers.createOrUpdateExtendShippingProtectionQuote(cart, params, Product);

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

            if (!shippingProtectionLineItem) {
                return;
            } else if (isShippingProtectionFound && shippingProtectionLineItem) {
                currentBasket.removeProductLineItem(shippingProtectionLineItem);
            }

            currentBasket.custom.isExtendShippingProtectionAdded = false;
            currentBasket.custom.isExtendShippingProtectionRemoved = true;

            cart.calculate();
        });
    }

    return;
}

/**
 * Update Shipping Protection Value
 */
function updateShippingProtection() {
    if (!cart) {
        return;
    }

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var params = request.httpParameterMap;

        var isShippingProtectionFound = false;
        var shippingProtectionLineItem = null;

        Transaction.wrap(function () {
            var allLineItems = cart.object.getAllProductLineItems();
            collections.forEach(allLineItems, function (productLineItem) {
                if (productLineItem.custom.isExtendShippingProtection) {
                    isShippingProtectionFound = true;
                    shippingProtectionLineItem = productLineItem;
                }
            });

            if (isShippingProtectionFound && shippingProtectionLineItem) {
                extendShippingProtectionHelpers.createOrUpdateExtendShippingProtectionQuote(cart, params, Product);
            }

            shippingProtectionLineItem.custom.isESPupdated = false;
            cart.calculate();
        });
    }

    return;
}

/*
* Module exports
*/

/*
* Exposed methods.
*/

/** Get the Extend Shipping Protection Config.
 * @see {@link module:controllers/ExtendSP~getConfig} */
exports.GetConfig = guard.ensure(['get', 'https'], getConfig);

/** Create Extend Shipping Protection Quotes. Make a call to Shipping API.
 * @see {@link module:controllers/ExtendSP~shippingProtectionCreateQuotes} */
exports.ShippingProtectionCreateQuotes = guard.ensure(['post', 'https'], shippingProtectionCreateQuotes);

/** Add Extend Shipping Offer via cart.
 * @see {@link module:controllers/ExtendSP~addExtendShippingOffer} */
exports.AddExtendShippingOffer = guard.ensure(['post', 'https'], addExtendShippingOffer);

/** Add Extend Shipping Offer via cart.
 * @see {@link module:controllers/ExtendSP~removeShippingProtection} */
exports.RemoveShippingProtection = guard.ensure(['get', 'https'], removeShippingProtection);

/** Add Extend Shipping Offer via cart.
 * @see {@link module:controllers/ExtendSP~updateShippingProtection} */
exports.UpdateShippingProtection = guard.ensure(['post', 'https'], updateShippingProtection);

