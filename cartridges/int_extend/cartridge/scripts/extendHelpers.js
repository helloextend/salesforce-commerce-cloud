'use strict';

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
    
    if (params.extendPlanId.isEmpty() || params.extendPrice.isEmpty() || params.extendTerm.isEmpty()) {
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

        Transaction.wrap(function() {
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
            };
            break;
        }
    }

    return JSON.stringify(obj);
}

/**
 * Get Extend plan JSON object
 * @param {dw.order.ProductLineItem} pLi : API ProductLineItem object
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
 * @param {dw.order.Order} order : API Order object
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
 * Add Extend products to Contracts queue, from a provided order
 * @param {dw.order.Order} order : order that's just been placed
 */
function addContractToQueue(order) {
    var Site = require('dw/system/Site');
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
                    queueObj.custom.currency = Site.getCurrent().getDefaultCurrency();
                    queueObj.custom.plan = getExtendPlan(pLi);
                    queueObj.custom.product = getSFCCProduct(order, pLi.custom.parentLineItemUUID);
                    queueObj.custom.customer = getCustomer(order);
                });
            }
        }
    }
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
 * Create lead for product that do not have Extend protection plans associated with them
 * @param {dw.order.Order} order : order that's just been placed
 */
function createLeads(order) {
    var Transaction = require('dw/system/Transaction');
    var extend = require('~/cartridge/scripts/extend'); 

    var plans = getExtendPlansParents(order);

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        if (!pLi.custom.parentLineItemUUID && pLi.custom.isWarrantable) {
            var isExtendedLI = getIsProductLineItemExtended(pLi, plans);

            if (!isExtendedLI) {
                var lead = getLeadObject(pLi, order);

                // Service call to leads endpoint
                var response = extend.createLead(JSON.stringify(lead));

                if (response.leadToken) {
                    Transaction.wrap(function () {
                        pLi.custom.leadToken = response.leadToken;
                    });
                }
            }
        }
    }
}

module.exports = {
    createOrUpdateExtendLineItem: createOrUpdateExtendLineItem,
    checkForWarrantyLI: checkForWarrantyLI,
    addContractToQueue: addContractToQueue,
    createLeads: createLeads
};
