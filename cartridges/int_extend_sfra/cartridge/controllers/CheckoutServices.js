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
 * Add Extend products to Contracts queue
 */
server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var extend = require('~/cartridge/scripts/extend'); 
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
                });
            }
        } else if (pLi.custom.isWarrantable) {
            // Create lead for product that do not have Extend protection plans associated with them
            var isExtendedLI = false;
            
            if (pLi.custom.persistentUUID) {
                for (var n = 0; n < plans.length; n++) {
                    if (plans[n] === pLi.custom.persistentUUID) {
                        isExtendedLI = true;
                        break;
                    }
                }
            }
            if (!isExtendedLI) {
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
                // Service call to leads endpoint
                extend.createLead(JSON.stringify(lead));
            }
        }
    }

    return next();
});

module.exports = server.exports();