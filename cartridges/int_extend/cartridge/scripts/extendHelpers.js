/* eslint-disable consistent-return */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
/* eslint-disable no-continue */
/* eslint-disable valid-jsdoc */
/* eslint-disable radix */
/* eslint-disable no-redeclare */
/* eslint-disable block-scoped-var */
/* eslint-disable no-loop-func */
'use strict';

var Site = require('dw/system/Site').getCurrent();

/**
 * Return used plan for added extend product
 * @param {Object} plans - object with plans get from extend API
 * @param {Object} extendPlanId - id of used plan for added extend product
 * @returns {Object} - current plan in plans object
 */
function getUsedPlan(plans, extendPlanId) {
    var apiVersion = Site.getCustomPreferenceValue('extendAPIVersion').value;
    if (apiVersion === 'default' || apiVersion === '2019-08-01') {
        for (var j = 0; j < plans.length; j++) {
            var currentPlan = plans[j];
            if (currentPlan.id === extendPlanId) {
                return currentPlan;
            }
        }
    } else {
        var plansKeys = Object.keys(plans);
        for (var i = 0; i < plansKeys.length; i++) {
            var currentPlanType = plans[plansKeys[i]];
            if (!empty(currentPlanType)) {
                for (var j = 0; j < currentPlanType.length; j++) {
                    var currentPlan = currentPlanType[j];
                    if (currentPlan.id === extendPlanId) {
                        return currentPlan;
                    }
                }
            }
        }
    }
}

/**
 * Return is offer valid
 * @param {Object} params - http params with offer information
 * @returns {boolean} - is offer price valid
 */
function validateOffer(params) {
    var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
    var extend = require('~/cartridge/scripts/extend');
    var isValid = false;

    if (params.extendPlanId.isEmpty() || params.extendPrice.isEmpty() || params.pid.isEmpty()) {
        return isValid;
    }

    var extendPlanId = params.extendPlanId.value;
    var extendPrice = params.extendPrice.value;
    var pid = params.pid.value;

    var paramOjb = {
        pid: pid
    };

    var offer = extend.getOffer(paramOjb);
    var usedPlan = getUsedPlan(offer.plans, extendPlanId);

    if (!usedPlan) {
        logger.error('Extend warranty plan with id "{0}" could not be found.', extendPlanId);
        return isValid;
    }

    if (+extendPrice !== usedPlan.price) {
        logger.error('Wrong price for the warranty plan with id "{0}". Wrong: {1}. Correct: {2} ',
            extendPlanId,
            +extendPrice,
            usedPlan.price
        );
        return isValid;
    }

    return true;
}

/**
* Adds Extend warranty product line items to cart
*
* @transactional
* @param {Object} cart The Cart model
* @param {Object} params The params object
* @param {Object} Product Product model
*/
function createOrUpdateExtendLineItem(cart, params, Product) {
    var Transaction = require('dw/system/Transaction');
    var isValid = validateOffer(params);

    if (params.extendPlanId.isEmpty() || params.extendPrice.isEmpty() || params.extendTerm.isEmpty() || !isValid) {
        return;
    }

    var currentBasket = cart.object;
    var quantity = params.quantity.doubleValue || params.Quantity.doubleValue;
    var parentLineItem;
    var warrantyLi;

    // Determine the parent product by selecting last added (modified) line item
    var lineItems = currentBasket.getProductLineItems(params.pid.stringValue);
    parentLineItem = lineItems[0];
    for (var i = 1; i < lineItems.length; i++) {
        if (lineItems[i].lastModified.getMilliseconds() > parentLineItem.lastModified.getMilliseconds()) {
            parentLineItem = lineItems[i];
        }
    }

    // Determine whether warranty line item already exists for this product line item
    var currentWarrantyLi;
    var warrantyLis = currentBasket.getProductLineItems('EXTEND-' + params.extendTerm);
    for (var i = 0; i < warrantyLis.length; i++) {
        if (warrantyLis[i].custom.parentLineItemUUID === parentLineItem.UUID) {
            currentWarrantyLi = warrantyLis[i];
            break;
        }
    }

    if (currentWarrantyLi) {
        var quantityInCart = currentWarrantyLi.getQuantity();

        Transaction.wrap(function () {
            currentWarrantyLi.setQuantityValue(quantityInCart + parseInt(quantity, 10));
        });

        return;
    }

    // If no warranty has been updated, create one
    var productModel = Product.get('EXTEND-' + params.extendTerm);
    var shipment = currentBasket.defaultShipment;
    var productToAdd = productModel.object;
    var productOptionModel = productModel.updateOptionSelection(params);

    Transaction.wrap(function () {
        warrantyLi = cart.createProductLineItem(productToAdd, productOptionModel, shipment);

        // Configure the Extend ProductLineItem
        warrantyLi.setProductName('Extend Product Protection: ' + parseInt(params.extendTerm / 12) + ' years for ' + parentLineItem.productName);
        warrantyLi.setLineItemText('Extend Product Protection: ' + parseInt(params.extendTerm / 12) + ' years for ' + parentLineItem.productName);
        warrantyLi.setManufacturerSKU(params.extendPlanId);
        warrantyLi.setPriceValue(parseInt(params.extendPrice, 10) / 100);
        warrantyLi.setQuantityValue(parseInt(quantity, 10));
        warrantyLi.custom.parentLineItemUUID = parentLineItem.UUID;
        parentLineItem.custom.persistentUUID = parentLineItem.UUID;

        cart.calculate();
    });
}


/**
* Remove Extend wrranty product line items from cart.
*
* @transactional
* @param {Object} cart The Cart model.
* @param {Object} formgroup The formgroup object.
*/
function checkForWarrantyLI(cart, productLineItem) {
    var currentBasket = cart.object;

    // Determine the parent product for the current Extend warranty product
    var warrantyLineItem;
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].custom.parentLineItemUUID === productLineItem.UUID) {
            warrantyLineItem = currentBasket.productLineItems[i];
            break;
        }
    }

    return warrantyLineItem;
}

/**
 * Converts Money object to integer cents value
 * @param {dw.value.Money} value : API Money object
 * @return {Integer} cents value
 */
function moneyToCents(value) {
    return value.multiply(100).getValue();
}

/**
 * Get SFCC product JSON object
 * @param {dw.order.Order} order : API Order object
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
 * @param {dw.order.ProductLineItem} pLi : API ProductLineItem object
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
 * @param {dw.order.Order} order : API Order object
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
    };

    return JSON.stringify(shippingAddress);
}

/**
 * Add Extend products to Contracts queue, from a provided order
 * @param {dw.order.Order} order : order that's just been placed
 */
function createContractsCO(order) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        if (pLi.custom.parentLineItemUUID) {
            for (var j = 1; j <= pLi.getQuantityValue(); j++) {
                Transaction.wrap(function () {
                    var queueObj = CustomObjectMgr.createCustomObject('ExtendContractsQueue', pLi.UUID + '-' + j);
                    queueObj.custom.orderNo = order.getOrderNo();
                    queueObj.custom.orderTotal = moneyToCents(order.getTotalGrossPrice());
                    queueObj.custom.currency = Site.getDefaultCurrency();
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
                    if (pLi.custom.persistentUUID === productLi.custom.parentLineItemUUID) {
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
 * Add Extend products to Contracts queue, from a provided order
 * @param {dw.order.Order} order : order that's just been placed
 */
function addContractToQueue(order) {
    var OrderMgr = require('dw/order/OrderMgr');
    var extend = require('~/cartridge/scripts/extend');

    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    if (apiMethod === 'contractsAPI') {
        createContractsCO(order);
    } else {
        var customer = getCustomer(order);
        var ordersResponse = extend.createOrders({ order: order, customer: customer });
        processOrdersResponse(ordersResponse, order);
    }

    return;
}

module.exports = {
    createOrUpdateExtendLineItem: createOrUpdateExtendLineItem,
    checkForWarrantyLI: checkForWarrantyLI,
    addContractToQueue: addContractToQueue,
    validateOffer: validateOffer
};
