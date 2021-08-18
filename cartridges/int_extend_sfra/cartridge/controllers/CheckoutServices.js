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
        purchasePrice: Math.ceil(moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue))),
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
 * Get parentLineItemUUID of extended plans in order
 * @param {Order} order : API Order object
 * @returns {Array} an array of parentLineItemUUID of extended plans.
 */
function getExtendPlansParents(order) {
    var plans = [];
    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
        if (pLi.custom.parentLineItemUUID) {
            plans.push(pLi.custom.parentLineItemUUID);
        }
    }
    return plans;
}

/**
 * Get is product line item has extend protection plan
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @param {Array} plans : an array of parentLineItemUUID of extended plans.
 * @returns {Boolean} true if product line item has extend protection plan.
 */
function getIsProductLineItemExtended(pLi, plans) {
    var isExtendedLI = false;
    if (pLi.custom.persistentUUID) {
        for (var n = 0; n < plans.length; n++) {
            if (plans[n] === pLi.custom.persistentUUID) {
                isExtendedLI = true;
                break;
            }
        }
    }

    return isExtendedLI;
}

/**
 * Get lead object for service call
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @param {Order} order : API Order object
 * @returns {Object} lead object.
 */
function getLeadObject(pLi, order) {
    var lead = {
        customer: {
            email: order.customerEmail
        },
        quantity: pLi.quantity.value,
        product: {
            purchasePrice: {
                currencyCode: order.currencyCode,
                amount: moneyToCents(pLi.getAdjustedNetPrice())
            },
            referenceId: pLi.productID,
            transactionDate: Date.now(),
            transactionId: order.currentOrderNo
        },
    }

    return lead;
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
 * Add Extend products to Contracts queue or create lead products
 */
server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var webServices = require('~/cartridge/scripts/services/rest'); 
    var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
    var viewData = res.getViewData();

    if (viewData.error) {
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID);
    var plans = getExtendPlansParents(order);

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
        } else if (pLi.custom.isWarrantable) {
            // Create lead for product that do not have Extend protection plans associated with them
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion').value;
            if (API_VERSION === 'default') {
                logger.debug('Leads endpoint does not support default API version');
            } else {
                var isExtendedLI = getIsProductLineItemExtended(pLi, plans);

                if (!isExtendedLI) {
                    var lead = getLeadObject(pLi, order);
    
                    // Service call to leads endpoint
                    var response = webServices.makeServiceCall('leads', lead);
    
                    if (response.leadToken) {
                        Transaction.wrap(function () {
                            pLi.custom.leadToken = response.leadToken;
                        });
                    }
                }
            }
        }
    }

    return next();
});

module.exports = server.exports();