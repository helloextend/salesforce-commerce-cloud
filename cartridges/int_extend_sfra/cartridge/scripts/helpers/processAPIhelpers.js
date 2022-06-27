/* eslint-disable new-cap */
/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
'use strict';

/**
 * Converts Money object to integer cents value
 * @param {Money} value : API Money object
 * @return {Integer} cents value
 */
function moneyToCents(value) {
    return value.decimalValue * 100;
}

/**
 * Get SFCC product JSON object
 * @param {Order} order : API Order object
 * @param {string} UUID : UUID for the associated parent productLineItem
 * @return {string} stringified object
 */
function getSFCCProduct(order, UUID) {
    var obj = {};

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
        if (pLi.custom.persistentUUID === UUID) {
            obj = {
                referenceId: pLi.productID,
                purchasePrice: moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue))
            };
            break;
        }
    }

    return JSON.stringify(obj);
}

/**
 * Get Extend plan JSON object
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @return {string} stringified object
 */
function getExtendPlan(pLi) {
    var obj = {
        purchasePrice: Math.ceil(moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue))),
        planId: pLi.getManufacturerSKU()
    };

    return JSON.stringify(obj);
}

/**
 * Get customer JSON object
 * @param {Order} order : API Order object
 * @return {string} stringified object
 */
function getCustomer(order) {
    var address = order.getBillingAddress();
    var obj = {
        phone: address.getPhone(),
        email: order.getCustomerEmail(),
        name: order.getCustomerName(),
        address: {
            address1: address.getAddress1(),
            address2: address.getAddress2(),
            city: address.getCity(),
            countryCode: address.getCountryCode().toString(),
            postalCode: address.getPostalCode(),
            provinceCode: address.getStateCode()
        }
    };

    return JSON.stringify(obj);
}

/**
 * Get customer shipping address JSON object
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @return {string} stringified object
 */
function getShippingAddress(pLi) {
    var address = pLi.getShipment().getShippingAddress();
    var shippingAddress = {
        address1: address.getAddress1(),
        address2: address.getAddress2(),
        city: address.getCity(),
        countryCode: address.getCountryCode().toString(),
        postalCode: address.getPostalCode(),
        provinceCode: address.getStateCode()
    };

    return JSON.stringify(shippingAddress);
}

/**
 * Create contracts CO
 * @param {dw.order.Order} order : API order
 * @param {string} orderID : id of the order
 */
function createContractsCO(order, orderID) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Site = require('dw/system/Site');
    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        if (pLi.custom.parentLineItemUUID) {
            for (var j = 1; j <= pLi.getQuantityValue(); j++) {
                Transaction.wrap(function () {
                    var queueObj = CustomObjectMgr.createCustomObject('ExtendContractsQueue', pLi.UUID + '-' + j);
                    queueObj.custom.orderNo = orderID;
                    queueObj.custom.orderTotal = moneyToCents(order.getTotalGrossPrice());
                    queueObj.custom.currency = Site.getCurrent().getDefaultCurrency();
                    queueObj.custom.plan = getExtendPlan(pLi);
                    queueObj.custom.product = getSFCCProduct(order, pLi.custom.parentLineItemUUID);
                    queueObj.custom.customer = getCustomer(order);
                    queueObj.custom.shippingAddress = getShippingAddress(pLi);
                });
            }
        }
    }
}

/**
 * Create order custom object
 * @param {dw.order.Order} order : API order
 * @param {string} orderID : id of the order
 */
function createExtendOrderQueue(order, orderID) {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Site = require('dw/system/Site');
    var pLi = order.productLineItems[0];

    Transaction.wrap(function () {
        var queueObj = CustomObjectMgr.createCustomObject('ExtendOrderQueue', orderID);
        queueObj.custom.OrderNo = orderID;
        queueObj.custom.orderTotal = moneyToCents(order.getTotalGrossPrice());
        queueObj.custom.currency = Site.getCurrent().getDefaultCurrency();
        queueObj.custom.customer = getCustomer(order);
        queueObj.custom.shippingAddress = getShippingAddress(pLi);
    });
}

/**
 * Process Orders Response
 * @param {Object} ordersResponse : API response from orders endpoint
 * @param {dw.order.Order} order : API order
 */
function processOrdersResponse(ordersResponse, order) {
    var Transaction = require('dw/system/Transaction');
    var ArrayList = require('dw/util/ArrayList');
    var responseLI = ordersResponse.lineItems;
    var ordersLI = order.productLineItems;

    for (var i = 0; i < responseLI.length; i++) {
        var apiCurrentLI = responseLI[i];
        var apiPid = apiCurrentLI.product.id;
        var matchedLI = null;
        var pLi = null;
        var productLi = null;
        var pid = null;

        if (apiCurrentLI.plan) {
            for (var j = 0; j < ordersLI.length; j++) {
                pLi = ordersLI[j];
                if (pLi.productID !== apiPid) {
                    continue;
                }
                for (var k = 0; k < ordersLI.length; k++) {
                    productLi = ordersLI[k];
                    if ((pLi.custom.persistentUUID === productLi.custom.parentLineItemUUID) && (apiCurrentLI.plan.id === productLi.getManufacturerSKU())) {
                        matchedLI = productLi;
                        break;
                    }
                }
                break;
            }
        } else {
            for (var l = 0; l < ordersLI.length; l++) {
                pLi = ordersLI[l];
                pid = pLi.productID;
                if (pid === apiPid) {
                    matchedLI = pLi;
                    break;
                }
            }
        }

        if (apiCurrentLI.plan && apiCurrentLI.leadToken) {
            for (var n = 0; n < ordersLI.length; n++) {
                pLi = ordersLI[n];
                if (pLi.custom.postPurchaseLeadToken === apiCurrentLI.leadToken) {
                    matchedLI = pLi;
                }
            }
        }

        Transaction.wrap(function () {
            var extendContractIds = ArrayList(matchedLI.custom.extendContractId || []);
            if (apiCurrentLI.contractId) {
                extendContractIds.add(apiCurrentLI.contractId);
                matchedLI.custom.extendContractId = extendContractIds;
            } else if (apiCurrentLI.plan && apiCurrentLI.leadToken) {
                extendContractIds.add(apiCurrentLI.contractId);
                matchedLI.custom.extendContractId = extendContractIds;
            } else if (apiCurrentLI.leadToken) {
                matchedLI.custom.leadToken = apiCurrentLI.leadToken;
            }
        });
    }
}

module.exports = {
    getCustomer: getCustomer,
    createContractsCO: createContractsCO,
    createExtendOrderQueue: createExtendOrderQueue,
    processOrdersResponse: processOrdersResponse
};