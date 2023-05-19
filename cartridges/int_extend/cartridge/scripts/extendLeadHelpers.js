/* eslint-disable new-cap */
/* eslint-disable no-use-before-define */
/* eslint-disable no-loop-func */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-continue */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var webService = require('~/cartridge/scripts/services/rest');
var collections = require('*/cartridge/scripts/util/collections');

var extend = require('*/cartridge/scripts/extend');

/**
 * Process an order, determine the type of lineItem and making a call to Leads API
 * @param {Object} paramObj - object with order and customer
 * @returns {Object} lead line item
 */
function processLineItems(paramObj) {
    var order = paramObj.order;
    var allLineItems = order.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (productLineItem.custom.isWarrantable && !productLineItem.custom.persistentUUID) {
            createLead(paramObj, productLineItem);
        } else if (productLineItem.custom.postPurchaseLeadToken) {
            getOfferInfoLeadsAPI(productLineItem);
        }
    });
}

/**
 * Get lead Order`s objects
 * @param {Object} paramObj - object with order and customer
 * @return {Object} requested object
 */
function getLeadPayload(paramObj, productLineItem) {
    var order = paramObj.order;
    var storeId = Site.getCustomPreferenceValue('extendStoreID');

    var requestObject = null;
    var product = null;

    var dividedPurchasePrice = productLineItem.adjustedNetPrice.divide(productLineItem.quantityValue);
    var dividedListPrice = productLineItem.price.divide(productLineItem.quantityValue);

    var listPrice = {
        amount: Math.ceil(extend.moneyToCents(dividedListPrice))
    };

    var purchasePrice = {
        amount: Math.ceil(extend.moneyToCents(dividedPurchasePrice))
    };

    product = {
        listPrice: listPrice,
        manufacturerWarrantyLengthLabor: 12,
        manufacturerWarrantyLengthParts: 36,
        purchasePrice: purchasePrice,
        referenceId: productLineItem.getProductID(),
        title: productLineItem.productName,
        transactionDate: order.getCreationDate().valueOf(),
        transactionId: order.orderNo
    };

    requestObject = {
        product: product,
        quantity: +productLineItem.quantityValue,
        sellerId: storeId
    };

    return requestObject;
}

/**
 * Create a lead. Make a post call to Leads API
 * @param {*} paramObj - object with order and customer
 */
function createLead(paramObj, productLineItem) {
    var requestObject = getLeadPayload(paramObj, productLineItem);
    var endpointName = 'leads';
    try {
        var response = webService.makeServiceCall(endpointName, requestObject);
    } catch (error) {
        logger.error('The error occurred during the lead order processing', error);
    }
}

/**
 * Get an info about the offers. Make a get call to Leads API.
 * @param {Object} productLineItem - product line item
 */
function getOfferInfoLeadsAPI(productLineItem) {
    var leadToken = productLineItem.custom.postPurchaseLeadToken;
    var requestObject = {};

    requestObject.leadToken = leadToken;

    var endpointName = 'getLeadsInfo';
    try {
        var response = webService.makeServiceCall(endpointName, requestObject);
    } catch (error) {
        logger.error('The error occurred during the lead order processing', error);
    }
}

/**
 * Process an order
 * @param {Object} paramObj - object with order and customer
 */
function processLeadOrders(paramObj) {
    if (!paramObj.order) {
        return;
    }

    processLineItems(paramObj);
}

module.exports = {
    processLeadOrders: processLeadOrders
};
