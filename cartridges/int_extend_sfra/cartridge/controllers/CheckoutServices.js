'use strict';

const server = require('server');

const page = module.superModule;
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
 * @param {String} UUID : UUID for the associated parent productLineItem
 * @return {String} stringified object
 */
function getSFCCProduct(order, UUID) {
    var obj = {};

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
        if (pLi.custom.persistentUUID === UUID) {
            obj = {
                referenceId: pLi.productID,
                purchasePrice: moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue))
            }
            break;
        }
    }

    return JSON.stringify(obj);
}

/**
 * Get Extend plan JSON object
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @return {String} stringified object
 */
function getExtendPlan(pLi) {
    var obj = {
        purchasePrice: moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue)),
        planId: pLi.getManufacturerSKU()
    };

    return JSON.stringify(obj);
}

/**
 * Get customer JSON object
 * @param {Order} order : API Order object
 * @return {String} stringified object
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
 * @return {String} stringified object
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
    }

    return JSON.stringify(shippingAddress);
}

/**
 * Add Extend products to Contracts queue
 */
server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var viewData = res.getViewData();

    if (viewData.error) {
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID);

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        if (pLi.custom.parentLineItemUUID) {
            for (var j = 1; j <= pLi.getQuantityValue(); j++) {
                Transaction.wrap(function () {
                    var queueObj = CustomObjectMgr.createCustomObject('ExtendContractsQueue', pLi.UUID + '-' + j);
                    queueObj.custom.orderNo = viewData.orderID;
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

    return next();
});

module.exports = server.exports();