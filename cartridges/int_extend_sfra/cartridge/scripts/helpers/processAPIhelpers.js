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
 * Process response to get matched line item to fill extendContractIds field
 * @param {string} apiPid - current id of product
 * @param {Object} ordersLI - current order
 * @param {Object} apiCurrentLI - response line item's info
 * @returns {Object} matched line item
 */
function processContracts(apiPid, ordersLI, apiCurrentLI) {
    var matchedLI = null;
    var pLi = null;
    var productLi = null;

    for (var i = 0; i < ordersLI.length; i++) {
        pLi = ordersLI[i];
        if (pLi.productID !== apiPid) {
            continue;
        }
        for (var j = 0; j < ordersLI.length; j++) {
            productLi = ordersLI[j];
            if ((pLi.custom.persistentUUID === productLi.custom.parentLineItemUUID) && (apiCurrentLI.plan.id === productLi.getManufacturerSKU())) {
                matchedLI = productLi;
                break;
            }
        }
        break;
    }

    return matchedLI;
}

/**
 * Process response to get matched line item to fill extendContractIds field for Extend Shipping Protection Line item
 * @param {string} apiPid - current id of product
 * @param {Object} ordersLI - current order
 * @returns {Object} matched line item
 */
function processLeadToken(apiPid, ordersLI) {
    var matchedLI = null;
    var pLi = null;
    var pid = null;

    for (var i = 0; i < ordersLI.length; i++) {
        pLi = ordersLI[i];
        pid = pLi.productID;

        if (pid === apiPid) {
            matchedLI = pLi;
            break;
        }
    }

    return matchedLI;
}

/**
 * Process response to get matched line item to fill extendContractIds field for Extend Shipping Protection Line item
 * @param {string} apiPid - current id of product
 * @param {Object} ordersLI - current order
 * @returns {Object} matched line item
 */
function processExtendShippingProtection(apiPid, ordersLI) {
    var matchedLI = null;
    var pLi = null;
    var pid = null;

    for (var i = 0; i < ordersLI.length; i++) {
        pLi = ordersLI[i];
        pid = pLi.productID;
        if (pid === 'EXTEND-SHIPPING-PROTECTION') {
            matchedLI = pLi;
            break;
        }
    }

    return matchedLI;
}

/**
 * Process response to get matched line item to fill extendContractIds field for Line Item which were used by LeadToken
 * @param {Object} ordersLI - current order
 * @param {Object} apiCurrentLI - response line item's info
 * @returns {Object} matched line item
 */
function processPostPurchase(ordersLI, apiCurrentLI) {
    var matchedLI = null;
    var pLi = null;

    for (var i = 0; i < ordersLI.length; i++) {
        pLi = ordersLI[i];
        if (pLi.custom.postPurchaseLeadToken === apiCurrentLI.leadToken) {
            matchedLI = pLi;
        }
    }

    return matchedLI;
}

/**
 * Process Orders Response
 * @param {Object} ordersResponse : API response from orders endpoint
 * @param {dw.order.Order} order : API order
 */
function processOrdersResponse(ordersResponse, order) {
    var Transaction = require('dw/system/Transaction');
    var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
    var ArrayList = require('dw/util/ArrayList');
    var responseLI = ordersResponse.lineItems;
    var ordersLI = order.productLineItems;
    var apiPid = null;

    for (var i = 0; i < responseLI.length; i++) {
        var apiCurrentLI = responseLI[i];
        if (apiCurrentLI.product) {
            apiPid = apiCurrentLI.product.id;
        }
        var matchedLI = null;

        if (apiCurrentLI.plan && !apiCurrentLI.quoteId) {
            matchedLI = processContracts(apiPid, ordersLI, apiCurrentLI) || processPostPurchase(ordersLI, apiCurrentLI);
        } else if (apiCurrentLI.leadToken && (apiCurrentLI.type === 'lead')) {
            matchedLI = processLeadToken(apiPid, ordersLI);
        } else if (apiCurrentLI.quoteId && (apiCurrentLI.type === 'shipments')) {
            matchedLI = processExtendShippingProtection(apiPid, ordersLI);
        } else if (apiCurrentLI.plan && apiCurrentLI.leadToken) {
            matchedLI = processPostPurchase(ordersLI, apiCurrentLI);
        } else {
            logger.info('Current Resonses has an invalid body: {0}', apiCurrentLI);
        }

        Transaction.wrap(function () {
            var extendContractIds = ArrayList(matchedLI.custom.extendContractId || []);
            var leadContractId = ArrayList(matchedLI.custom.leadContractId || []);
            if (apiCurrentLI.contractId) {
                extendContractIds.add(apiCurrentLI.contractId);
                matchedLI.custom.extendContractId = extendContractIds;
            } else if (apiCurrentLI.plan && apiCurrentLI.leadToken) {
                extendContractIds.add(apiCurrentLI.contractId);
                matchedLI.custom.extendContractId = extendContractIds;
            } else if (apiCurrentLI.leadToken && (apiCurrentLI.type === 'lead')) {
                leadContractId.add(apiCurrentLI.id);
                matchedLI.custom.leadContractId = leadContractId;
                matchedLI.custom.leadToken = apiCurrentLI.leadToken;
            } else if (apiCurrentLI.quoteId && (apiCurrentLI.type === 'shipments')) {
                matchedLI.custom.extendContractId = apiCurrentLI.contractId;
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
