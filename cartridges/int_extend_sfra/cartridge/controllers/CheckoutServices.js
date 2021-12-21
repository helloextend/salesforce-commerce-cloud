/* eslint-disable no-loop-func */
'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

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
 * Process Orders Response
 * @param {Object} ordersResponse : API response from orders endpoint
 * @param {dw.order.Order} order : API order
 */
function processOrdersResponse(ordersResponse, order) {
    var Transaction = require('dw/system/Transaction');
    var ArrayList = require('dw/util/ArrayList');
    var responseLI = ordersResponse.lineItems;

    for (var i = 0; i < responseLI.length; i++) {
        var apiCurrentLI = responseLI[i];
        var apiPid = apiCurrentLI.product.id;
        var matchedLI = null;
        var pLi = null;
        if (apiCurrentLI.plan) {
            for (var j = 0; j < order.productLineItems.length; j++) {
                pLi = order.productLineItems[j];
                if (pLi.productID !== apiPid) {
                    continue;
                }
                for (var k = 0; k < order.productLineItems.length; k++) {
                    var productLi = order.productLineItems[k];
                    if (pLi.custom.persistentUUID === productLi.custom.parentLineItemUUID) {
                        matchedLI = productLi;
                        break;
                    }
                }
                break;
            }
        } else {
            for (var m = 0; m < order.productLineItems.length; m++) {
                pLi = order.productLineItems[m];
                var pid = pLi.productID;
                if (apiPid === pid) {
                    matchedLI = pLi;
                    break;
                }
            }
        }

        Transaction.wrap(function () {
            if (apiCurrentLI.contractId) {
                var extendContractIds = ArrayList(matchedLI.custom.extendContractId || []);
                extendContractIds.add(apiCurrentLI.contractId);
                matchedLI.custom.extendContractId = extendContractIds;
            } else if (apiCurrentLI.leadToken) {
                matchedLI.custom.leadToken = apiCurrentLI.leadToken;
            }
        });
    }
}

/**
 * Add Extend products to Contracts queue
 */
server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site').getCurrent();
    var OrderMgr = require('dw/order/OrderMgr');
    var extend = require('~/cartridge/scripts/extend');

    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    var viewData = res.getViewData();

    if (viewData.error) {
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID);

    if (apiMethod === 'contractsAPI') {
        createContractsCO(order, viewData.orderID);
    } else {
        var customer = getCustomer(order);
        var ordersResponse = extend.createOrders({ order: order, customer: customer });
        processOrdersResponse(ordersResponse, order);
    }


    return next();
});

module.exports = server.exports();
