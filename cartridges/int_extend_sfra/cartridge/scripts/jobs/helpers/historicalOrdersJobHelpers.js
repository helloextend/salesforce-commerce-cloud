/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */
'use strict';

var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var Site = require('dw/system/Site').getCurrent();
var Transaction = require('dw/system/Transaction');

/**
 * Get orders payload for specific API version
 * @param {ArrayList<Product>} orderBatch - array of orders
 * @returns {Array} requestObject - payload object for request
 */
function sendHistoricalOrdersBatch(orderBatch) {
    var extend = require('~/cartridge/scripts/extend');

    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var requestObject = [];

    for (var i = 0; i < orderBatch.length; i++) {
        var currentOrder = orderBatch[i];
        try {
            var orderObj = {};

            orderObj.storeId = STORE_ID;
            orderObj.storeName = 'SFCC';

            var billingAddress = currentOrder.getBillingAddress();

            var customer = {
                billingAddress: {
                    address1: billingAddress.getAddress1(),
                    address2: billingAddress.getAddress2(),
                    city: billingAddress.getCity(),
                    countryCode: billingAddress.getCountryCode().toString(),
                    postalCode: billingAddress.getPostalCode(),
                    province: billingAddress.getStateCode()
                },
                email: currentOrder.customerEmail,
                name: currentOrder.customerName
            };

            orderObj.currency = currentOrder.getCurrencyCode();
            orderObj.customer = customer;

            orderObj.isTest = true;

            orderObj.total = Math.ceil(extend.moneyToCents(currentOrder.getTotalGrossPrice()));
            orderObj.transactionId = currentOrder.orderNo;
            orderObj.lineItems = getOrdersBatchLineItems(currentOrder);

            requestObject.push(orderObj);
        } catch (error) {
            logger.error('Request object could not be created. {0}', error);
        }
    }
    return requestObject;
}

/**
 * Get Order`s line items objects
 * @param {dw.order.Order} order : API order
 * @return {Array<Object>} array of line items objects
 */
function getOrdersBatchLineItems(order) {
    var extend = require('~/cartridge/scripts/extend');

    var lineItems = [];
    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
        if (!pLi.custom.parentLineItemUUID) {
            var pliObj = {};
            pliObj.warrantable = false;
            pliObj.quantity = pLi.quantityValue;
            pliObj.product = extend.getSFCCProduct(pLi);

            if (pLi.custom.isWarrantable) {
                pliObj.warrantable = true;
            }
            lineItems.push(pliObj);
        }
    }
    return lineItems;
}

/**
 * Get Order`s line items objects
 * @param {dw.order.Order} order : API order
 * @returns {boolean} true if does otherwise false
 */
function doesOrderHaveExtensions(order) {
    var isExtendedPLI = false;
    try {
        Transaction.wrap(function () {
            var allLineItems = order.getAllProductLineItems();
            for (var i = 0; i < allLineItems.length; i++) {
                var pLi = allLineItems[i];
                var productID = pLi.getProductID();
                var productName = pLi.getProductName().toLowerCase();
                var isProductWarranty = productName.includes('extend protection plan');
                if (pLi.custom.parentLineItemUUID || productID === 'EXTEND-SHIPPING-PROTECTION' || isProductWarranty) {
                    order.custom.doesSentToExtend = 'The current order has been sent to the Extend';
                    isExtendedPLI = true;
                }
            }
        });
    } catch (error) {
        logger.error('The error occurred during the order processing', error);
    }

    return isExtendedPLI;
}

/**
 * Get orders payload for specific API version
 * @param {ArrayList<Product>} orderBatch - array of orders
 */
function markOrdersAsSent(orderBatch) {
    var collections = require('*/cartridge/scripts/util/collections');
    try {
        Transaction.wrap(function () {
            collections.forEach(orderBatch, function (order) {
                order.custom.doesSentToExtend = 'The current order has been sent to the Extend';
            });
        });
    } catch (error) {
        logger.error('The error occurred during the orders processing', error);
    }
}

module.exports = {
    sendHistoricalOrdersBatch: sendHistoricalOrdersBatch,
    doesOrderHaveExtensions: doesOrderHaveExtensions,
    markOrdersAsSent: markOrdersAsSent
};
