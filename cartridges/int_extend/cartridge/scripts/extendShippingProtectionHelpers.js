/* eslint-disable no-mixed-operators */
/* eslint-disable no-use-before-define */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable block-scoped-var */
/* eslint-disable consistent-return */
'use strict';

var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var Site = require('dw/system/Site').getCurrent();
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Converted cents to dollars
 * @param {number} productValue - product price value via cents
 * @returns productValue via dollars
 */
function getMoneyInDollars(productValue) {
    return productValue / 100;
}

/**
 * Create array of products to make a call to SP Api to create ESP quotes
 * @param {Object} currentBasket - current Basket
 * @returns array of product to create ESP quotes
 */
function getProductToCreateQuotes(currentBasket) {
    var products = [];

    var allLineItems = currentBasket.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (((productLineItem.custom.persistentUUID && !productLineItem.custom.parentLineItemUUID)
            || (!productLineItem.custom.persistentUUID && !productLineItem.custom.parentLineItemUUID))
            && !productLineItem.custom.isExtendShippingProtection
            && productLineItem.optionID !== 'extendTerm') {
            products.push(productLineItem);
        }
    });

    return products;
}

/**
 * Chack the availibility of the Extend Shipping Protection Plan in the cart
 * @param {Object} currentBasket - current Basket
 * @returns {boolean} is ESP in the cart
 */
function checkingForESP(currentBasket) {
    var isESPinCart = false;

    if (!currentBasket) {
        return;
    }

    var allLineItems = currentBasket.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (productLineItem.custom.isExtendShippingProtection) {
            isESPinCart = true;
        }
    });

    return isESPinCart;
}

/**
 * Add Extend Shippind Protection Line Item to cart
 * @param {Object} cart The cart Model
 * @param {Object} shippingProtectionProduct The product to add
 * @param {Number} shippingProtectionPriceValue The price of shipping protection
 */
function addExtendShippingProtectionToCart(cart, params, shippingProtectionProduct, shippingProtectionPriceValue) {
    var currentBasket = cart.object;
    if (!currentBasket) {
        return;
    }

    // Configure the Extend ProductLineItem
    var shipment = currentBasket.defaultShipment;
    var productToAdd = shippingProtectionProduct.object;

    var shippingProtectionLineItem = null;

    var shippingProtectionModel = shippingProtectionProduct;
    var extendShippingProtectionQuantity = 1;
    var productOptionModel = shippingProtectionModel.updateOptionSelection(params);

    Transaction.wrap(function () {
        shippingProtectionLineItem = cart.createProductLineItem(productToAdd, productOptionModel, shipment);

        shippingProtectionLineItem.setProductName('Extend Shipping Protection');
        shippingProtectionLineItem.setPriceValue(parseFloat(shippingProtectionPriceValue));
        shippingProtectionLineItem.setQuantityValue(extendShippingProtectionQuantity);
        shippingProtectionLineItem.custom.isExtendShippingProtection = true;

        currentBasket.custom.isExtendShippingProtectionAdded = true;

        cart.calculate();
    });
}

/**
 * get ESP Price Value
 * @param {Object} currentBasket - current basket
 * @param {string} storeID - storeID
 * @return {number} shippingProtectionPriceValue
 */
function getShippingProtectionPriceValue(currentBasket, storeID) {
    var extend = require('~/cartridge/scripts/extend');

    if (!currentBasket) {
        return;
    }

    var storeID = Site.getCurrent().getCustomPreferenceValue('extendStoreID');

    var products = [];

    if (currentBasket) {
        var products = getProductToCreateQuotes(currentBasket);
    }

    var createsShippingOffer = extend.createsShippingOfferQutes(storeID, products).response;

    var shippingProtectionPriceValue = getMoneyInDollars(createsShippingOffer.premium);

    if (!shippingProtectionPriceValue) {
        logger.info('Shipping quotes info {0}', createsShippingOffer.note);
        return;
    }

    return shippingProtectionPriceValue;
}

/**
 * Update ESP Price Value
 * @param {object} currentBasket - current basket
 */
function updateShippingProtectionPriceValue(cart, storeID, Product) {
    var currentBasket = cart.object;
    if (!currentBasket) {
        return;
    }

    var extendShippingProtectionLineItem = null;

    var allLineItems = currentBasket.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (productLineItem.custom.isExtendShippingProtection) {
            extendShippingProtectionLineItem = productLineItem;
        }
    });

    // new Extend Shipping Protection value
    var newESPvalue = getShippingProtectionPriceValue(currentBasket, storeID);

    currentBasket.removeProductLineItem(extendShippingProtectionLineItem);
    var shippingProtectionProduct = Product.get('EXTEND-SHIPPING-PROTECTION');

    addExtendShippingProtectionToCart(cart, shippingProtectionProduct, newESPvalue);
}

/**
 * Increase the quantity of items in cart and add custom attribute to basket
 * @param {Object} currentBasket - current Basket
 */
function createOrUpdateExtendShippingProtectionQuote(cart, params, Product) {
    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var currentBasket = cart.object;
        var storeID = Site.getCurrent().getCustomPreferenceValue('extendStoreID');
    
        var isExtendShippingProtectionAdded = checkingForESP(currentBasket);
    
        if (!isExtendShippingProtectionAdded) {
            // Get the quote to get ESP price
            // In case ESP HASN'T been added to the cart
    
            var shippingProtectionProduct = Product.get('EXTEND-SHIPPING-PROTECTION');
            var shippingProtectionPriceValue = getShippingProtectionPriceValue(currentBasket, storeID);

            if (shippingProtectionPriceValue) {
                addExtendShippingProtectionToCart(cart, params, shippingProtectionProduct, shippingProtectionPriceValue);
            }
        } else {
            // Update the quotes to get new ESP price
            // In case ESP has been added to the cart earlier
    
            updateShippingProtectionPriceValue(cart, params, storeID, Product);
        }
    }
}

/**
 * Create Shipping Protection Contract Line
 * @param {Object} order - current order
 */
function createShippingProtectionContractLine(order) {
    var extendShippingProtectionLineItem = null;

    var allLineItems = order.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (productLineItem.custom.isExtendShippingProtection) {
            extendShippingProtectionLineItem = productLineItem;
        }
    });

    var extendShippingQuoteId = extendShippingProtectionLineItem.custom.extendShippingQuoteId;

    var shippingProtectionLineItem = {};
    var shipmentInfo = [];

    shippingProtectionLineItem.type = 'shipments';

    var isExtendShippingProtection = Site.getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (isExtendShippingProtection) {
        shippingProtectionLineItem.quoteId = extendShippingQuoteId;
    }

    shippingProtectionLineItem.shipmentInfo = [];

    return shippingProtectionLineItem;
}

module.exports = {
    createOrUpdateExtendShippingProtectionQuote: createOrUpdateExtendShippingProtectionQuote,
    checkingForESP: checkingForESP,
    getProductToCreateQuotes: getProductToCreateQuotes,
    createShippingProtectionContractLine: createShippingProtectionContractLine
};
