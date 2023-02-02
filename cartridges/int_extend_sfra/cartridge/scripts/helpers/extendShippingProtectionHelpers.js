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
var BasketMgr = require('dw/order/BasketMgr');
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
 * Process extend shipping protecting config
 * @param {Object} cart - cart
 * @param {string} attachBehavior - extend shipping protection default statuses
 * OPT_IN: means that the offer is NOT selected by default, and the customer must choose to add it.
 * OPT_OUT: means that the offer is selected by default and will be included in the order unless the customer deselects it.
 * OPT_MERCHANT: means that shipping protection is included in every eligible order automatically, at the merchant’s choice
 */
function processExtendShippingProtectionConfig(currentBasket, attachBehavior) {
    if (attachBehavior === 'OPT_IN') {
        // checkbox should be unchecked
        return;
    } else if (attachBehavior === 'OPT_OUT') {
        // checkbox should be checked
        processOptOutAttachBehavior(currentBasket);
    }
}

/**
 * Process OPT_OUT attachBehavior
 * @param {Object} cart - object
 */
function processOptOutAttachBehavior(currentBasket) {
    try {
        if (!currentBasket.custom.isExtendShippingProtectionRemoved) {
            createOrUpdateExtendShippingProtectionQuote(currentBasket);
        }
    } catch (error) {
        logger.error('Could not to process OPT_OUT extend shipping protection attachBehavior. {0}', error);
    }
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
            && productLineItem.optionID !== 'extendTerm'
            && productLineItem.getPrice() > 0) {
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
function isExtendShippingProtectionAttend(currentBasket) {
    if (!currentBasket) {
        return;
    }

    var isESPinCart = false;

    Transaction.wrap(function () {
        var allLineItems = currentBasket.getAllProductLineItems();
        collections.forEach(allLineItems, function (productLineItem) {
            if (productLineItem.custom.isExtendShippingProtection) {
                currentBasket.custom.isExtendShippingProtectionAdded = true;
                currentBasket.custom.isExtendShippingProtectionRemoved = false;
                isESPinCart = true;
            }
        });
    });

    return isESPinCart;
}

/**
 * Add Extend Shippind Protection Line Item to cart
 * @param {Object} currentBasket - current basket
 */
function addExtendShippingProtectionToCart(currentBasket, shippingProtectionProduct, shippingProtectionPriceValue) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    if (!currentBasket) {
        return;
    }

    var shippingProtectionLineItem = null;
    var extendShippingProtectionQuantity = 1;

    // Add Extend Shipping Protection Line Item
    Transaction.wrap(function () {
        shippingProtectionLineItem = cartHelper.addLineItem(
            currentBasket,
            shippingProtectionProduct,
            extendShippingProtectionQuantity,
            [],
            shippingProtectionProduct.getOptionModel(),
            currentBasket.getDefaultShipment()
        );
    });

    Transaction.wrap(function () {
        shippingProtectionLineItem.setProductName('Extend Shipping Protection');
        shippingProtectionLineItem.setPriceValue(parseFloat(shippingProtectionPriceValue));
        shippingProtectionLineItem.setQuantityValue(extendShippingProtectionQuantity);
        shippingProtectionLineItem.custom.isExtendShippingProtection = true;
    });
}

/**
 * Determine wtether the product line item is Lead
 * @param {Object} currentBasket - current basket
 */
function isProductLineItemLead(currentBasket) {
    var isLead = false;
    var allLineItems = currentBasket.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (productLineItem.custom.leadExtendId) {
            isLead = true;
        }
    });

    return isLead;
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
function updateShippingProtectionPriceValue(currentBasket, storeID) {
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

    Transaction.wrap(function () {
        extendShippingProtectionLineItem.setPriceValue(parseFloat(newESPvalue));
    });
}

/**
 * Increase the quantity of items in cart and add custom attribute to basket
 * @param {Object} currentBasket - current Basket
 */
function createOrUpdateExtendShippingProtectionQuote(currentBasket) {
    var storeID = Site.getCurrent().getCustomPreferenceValue('extendStoreID');

    var isExtendShippingProtectionAdded = isExtendShippingProtectionAttend(currentBasket);

    if (!isExtendShippingProtectionAdded) {
        // Get the quote to get ESP price
        // In case ESP HASN'T been added to the cart

        var shippingProtectionProduct = ProductMgr.getProduct('EXTEND-SHIPPING-PROTECTION');
        var shippingProtectionPriceValue = getShippingProtectionPriceValue(currentBasket, storeID);

        if (shippingProtectionPriceValue) {
            addExtendShippingProtectionToCart(currentBasket, shippingProtectionProduct, shippingProtectionPriceValue);
        }
    } else {
        // Update the quotes to get new ESP price
        // In case ESP has been added to the cart earlier

        updateShippingProtectionPriceValue(currentBasket, storeID);
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

    if (!extendShippingProtectionLineItem) {
        return;
    }

    var shippingProtectionLineItem = {};
    var shipmentInfo = [];

    shippingProtectionLineItem.type = 'shipments';

    var extendShippingQuoteId = extendShippingProtectionLineItem.custom.extendShippingQuoteId;
    shippingProtectionLineItem.quoteId = extendShippingQuoteId;

    shippingProtectionLineItem.shipmentInfo = [];

    return shippingProtectionLineItem;
}

module.exports = {
    isExtendShippingProtectionAttend: isExtendShippingProtectionAttend,
    isProductLineItemLead: isProductLineItemLead,
    addExtendShippingProtectionToCart: addExtendShippingProtectionToCart,
    processExtendShippingProtectionConfig: processExtendShippingProtectionConfig,
    createOrUpdateExtendShippingProtectionQuote: createOrUpdateExtendShippingProtectionQuote,
    getProductToCreateQuotes: getProductToCreateQuotes,
    createShippingProtectionContractLine: createShippingProtectionContractLine
};
