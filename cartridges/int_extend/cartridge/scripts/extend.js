/* eslint-disable no-use-before-define */
/* eslint-disable new-cap */
/* eslint-disable no-loop-func */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
'use strict';

var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var webService = require('~/cartridge/scripts/services/rest');

/**
 * Get contracts payload for default API version
 * @param {dw.object.CustomObject} paramObj - instance of ExtendContractsQueue object
 * @returns {Object} requestObject - payload object for request
 */
function getContractsDefaultPayload(paramObj) {
    var contractCO = paramObj.custom;
    var customer = JSON.parse(contractCO.customer);
    var product = JSON.parse(contractCO.product);
    var plan = JSON.parse(contractCO.plan);

    var requestObject = {
        transactionId: contractCO.orderNo,
        transactionTotal: contractCO.orderTotal,
        transactionDate: paramObj.getCreationDate().valueOf(),
        customer: customer,
        product: product,
        currency: contractCO.currency,
        plan: plan
    };

    return requestObject;
}

/**
 * Get contracts payload for specific API version
 * @param {dw.object.CustomObject} paramObj - instance of ExtendContractsQueue object
 * @returns {Object} requestObject - payload object for request
 */
function getContractsPayload(paramObj) {
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var extendAPIMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    var defaultPayload = getContractsDefaultPayload(paramObj);

    var contractCO = paramObj.custom;
    var customer = JSON.parse(contractCO.customer);
    var shippingAddress = JSON.parse(contractCO.shippingAddress);
    var product = JSON.parse(contractCO.product);
    var plan = JSON.parse(contractCO.plan);
    var requestObject = defaultPayload;

    requestObject.transactionTotal = {
        currencyCode: contractCO.currency,
        amount: contractCO.orderTotal
    };

    requestObject.customer.billingAddress = customer.address;
    requestObject.customer.shippingAddress = shippingAddress;
    delete requestObject.customer.address;

    requestObject.product.purchasePrice = {
        currencyCode: contractCO.currency,
        amount: product.purchasePrice
    };

    requestObject.plan.purchasePrice = {
        currencyCode: contractCO.currency,
        amount: plan.purchasePrice
    };

    return requestObject;
}

/**
 * Get products payload for specific API version
 * @param {ArrayList<Product>} productBatch - array of products
 * @returns {Array} requestObject - payload object for request
 */
function getProductsPayload(productBatch) {
    var extendAPIMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    var requestObject = [];

    for (var i = 0; i < productBatch.length; i++) {
        var product = productBatch[i];
        var EXTEND_IMAGE_VIEW_TYPE = Site.getCustomPreferenceValue('extendImageViewType');

        try {
            var category = '';
            if (product.isVariant()) {
                category = !empty(product.getMasterProduct().getPrimaryCategory()) ? product.getMasterProduct().getPrimaryCategory().getID() : '';
            } else {
                category = !empty(product.getPrimaryCategory()) ? product.getPrimaryCategory().getID() : '';
            }

            var price = product.priceModel.price.available && product.priceModel.price.value > 0 ? Math.round(product.priceModel.price.value * 100) : 0;

            if (!price) {
                logger.info('Product {0} needed to configure price book', product.getID());
                continue;
            }

            if (extendAPIMethod !== 'contractsAPI') {
                price = {
                    currencyCode: product.priceModel.price.getCurrencyCode(),
                    amount: price
                };
            }

            var productObj = {};
            productObj.brand = product.getBrand();
            productObj.category = category;
            productObj.description = !empty(product.getShortDescription()) ? product.getShortDescription().getMarkup() : '';
            productObj.imageUrl = product.getImage(EXTEND_IMAGE_VIEW_TYPE, 0) ? product.getImage(EXTEND_IMAGE_VIEW_TYPE, 0).getAbsURL().toString() : '';
            productObj.mfrWarranty = {
                parts: product.custom.mfrWarrantyParts,
                labor: product.custom.mfrWarrantyLabor
            };
            productObj.price = price;
            productObj.title = product.getName();
            productObj.referenceId = product.getID();
            productObj.parentReferenceId = product.isVariant() ? product.getMasterProduct().getID() : '';
            productObj.identifiers = {
                sku: product.getID(),
                upc: product.getUPC()
            };
            requestObject.push(productObj);
        } catch (error) {
            logger.error('Request object could not be created. {0}', error);
        }
    }

    return requestObject;
}

/**
 * Converts Money object to integer cents value
 * @param {Money} value : API Money object
 * @return {Integer} cents value
 */
function moneyToCents(value) {
    return value.decimalValue * 100;
}

/**
 * Get SFCC product object
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @return {Object} object that represents product
 */
function getSFCCProduct(pLi, UUID) {
    var dividedPurchasePrice = pLi.adjustedNetPrice.divide(pLi.quantityValue);
    var dividedListPrice = pLi.price.divide(pLi.quantityValue);

    var obj = {
        id: pLi.productID,
        purchasePrice: Math.ceil(moneyToCents(dividedPurchasePrice)),
        listPrice: Math.ceil(moneyToCents(dividedListPrice)),
        name: pLi.productName
    };

    return obj;
}

/**
 * Get Extend plan object
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @return {string} stringified object
 */
function getExtendPlan(pLi, order) {
    var productLineItems = order.productLineItems;
    var planObj = {};
    for (var i = 0; i < productLineItems.length; i++) {
        if (pLi.custom.persistentUUID === productLineItems[i].custom.parentLineItemUUID) {
            var warrantyItem = productLineItems[i];
            planObj.purchasePrice = Math.ceil(moneyToCents(warrantyItem.adjustedNetPrice.divide(warrantyItem.quantityValue)));
            planObj.id = warrantyItem.getManufacturerSKU();
        }
    }
    return planObj;
}

/**
 * Get ContractId for refunds endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - request object
 */
function getContractID(paramObj) {
    var requestObject = {
        contractId: paramObj.extendContractId
    };
    return requestObject;
}

/**
 * Get Order`s line items objects
 * @param {dw.order.Order} order : API order
 * @return {Array<Object>} array of line items objects
 */
function getLineItems(order) {
    var lineItems = [];
    var productsArray = [];
    var warrantiesArray = [];
    var pliObj = null;
    var productLi = null;
    var product = null;
    var extendAPIMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        // Determine whether API method is Orders API
        var ordersAPI = (extendAPIMethod === 'ordersAPIonOrderCreate') || (extendAPIMethod === 'ordersAPIonSchedule');

        // Determine whether line item is lead offer
        if (pLi.custom.postPurchaseLeadToken && ordersAPI) {
            pliObj = ordersAPIgetLeadsOfferPayload(pLi);
            lineItems.push(pliObj);
            continue;
        }

        if (pLi.custom.parentLineItemUUID) {
            warrantiesArray.push(pLi);
        } else {
            productsArray.push(pLi);
        }
    }

    for (var j = 0; j < productsArray.length; j++) {
        productLi = productsArray[j];
        product = getSFCCProduct(productLi);
        for (var k = 0; k < productLi.quantity.value; k++) {
            pliObj = {};
            pliObj.product = product;
            pliObj.lineItemTransactionID = productLi.getUUID();

            if (productLi.custom.isWarrantable) {
                pliObj.quantity = productLi.quantity.value;
                pliObj.warrantable = true;
                lineItems.push(pliObj);
                break;
            }

            if (!warrantiesArray.length && productLi.custom.persistentUUID) {
                break;
            }

            pliObj.warrantable = true;

            for (var m = 0; m < warrantiesArray.length; m++) {
                if (!warrantiesArray.length) {
                    break;
                }

                var warrantyLi = warrantiesArray[0];
                if (productLi.custom.persistentUUID === warrantyLi.custom.parentLineItemUUID) {
                    for (var l = 0; l < warrantyLi.quantity.value; l++) {
                        var plan = {};
                        plan.purchasePrice = Math.ceil(moneyToCents(warrantyLi.adjustedNetPrice.divide(warrantyLi.quantityValue)));
                        plan.id = warrantyLi.getManufacturerSKU();
                        pliObj.plan = plan;
                        lineItems.push(pliObj);
                        if (l === (warrantyLi.quantity.value - 1)) {
                            warrantiesArray.splice(0, 1);
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
    return lineItems;
}

/**
 * Get Order`s line items objects
 * @param {dw.order.Order} order : API order
 * @return {Array<Object>} array of line items objects
 */
function getOrdersBatchLineItems(order) {
    var lineItems = [];
    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
        if (!pLi.custom.parentLineItemUUID) {
            var pliObj = {};
            pliObj.warrantable = false;
            pliObj.quantity = pLi.quantityValue;
            pliObj.product = getSFCCProduct(pLi);

            if (pLi.custom.persistentUUID) {
                pliObj.warrantable = true;
                var plan = getExtendPlan(pLi, order);
                if (Object.keys(plan).length) {
                    pliObj.plan = plan;
                }
            } else if (pLi.custom.isWarrantable) {
                pliObj.warrantable = true;
            }
            lineItems.push(pliObj);
        }
    }
    return lineItems;
}

/**
 * Get customer object
 * @param {Object} customer : object with customer information
 * @param {Object} address : default shipping address
 * @return {Object} object that customer product
 */
function getCustomer(customer, address) {
    var customerObj = {};
    customerObj.billingAddress = customer.address;
    customerObj.email = customer.email;
    customerObj.name = customer.name;
    customerObj.phone = customer.phone;

    var shippingAddress = {
        address1: address.getAddress1(),
        address2: address.getAddress2(),
        city: address.getCity(),
        countryCode: address.getCountryCode().toString(),
        postalCode: address.getPostalCode(),
        provinceCode: address.getStateCode()
    };

    customerObj.shippingAddress = shippingAddress;
    return customerObj;
}


/**
 * Get Orders Create endpoint Payload
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - request object
 */
function getOrdersPayload(paramObj) {
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var extendShippingProtectionHelpers = require('*/cartridge/scripts/extendShippingProtectionHelpers');
    var order = paramObj.order;
    var customer = JSON.parse(paramObj.customer);
    var defaultShipment = order.getDefaultShipment();
    var defaultShippingAddress = defaultShipment.getShippingAddress();
    var requestObject = {};

    requestObject.storeId = STORE_ID;
    requestObject.storeName = Site.getCustomPreferenceValue('extendStoreName');

    requestObject.currency = order.getCurrencyCode();
    requestObject.customer = getCustomer(customer, defaultShippingAddress);

    requestObject.total = Math.ceil(moneyToCents(order.getTotalGrossPrice()));
    requestObject.transactionId = order.orderNo;
    try {
        requestObject.lineItems = getLineItems(order);
        var extendShippingProtectionLineItem = extendShippingProtectionHelpers.createShippingProtectionContractLine(order);
        requestObject.lineItems.push(extendShippingProtectionLineItem);
    } catch (error) {
        logger.info('Line Items Order Payload Error: {0}', error);
    }
    return requestObject;
}

/**
 * Get orders payload for specific API version
 * @param {ArrayList<Product>} orderBatch - array of orders
 * @returns {Array} requestObject - payload object for request
 */
function sendOrdersBatch(orderBatch) {
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

            orderObj.total = Math.ceil(moneyToCents(currentOrder.getTotalGrossPrice()));
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
 * Get info about plan
 * @param {Object} paramObj - object with id of contract and commit type
 * @param {Object} lineItem - leads offer line item
 * @returns - plan info
 */
function getPlanWithLead(paramObj, lineItem) {
    var plan = {};
    var purchasePrice = {};
    var order = paramObj.order;

    purchasePrice.currencyCode = order.currencyCode;
    purchasePrice.amount = Math.ceil(moneyToCents(lineItem.adjustedNetPrice.divide(lineItem.quantityValue)));

    plan.purchasePrice = purchasePrice;
    plan.planId = lineItem.getManufacturerSKU();

    return plan;
}

/**
 * Get leads request object to make a call via Contracts API
 * @param {Object} paramObj - object with id of contract and commit type
 * @param {Object} lineItem - leads offer line item
 * @returns {Object} - request object
 */
function contractsAPIgetLeadsOfferPayload(paramObj, lineItem) {
    var UUIDUtils = require('dw/util/UUIDUtils');
    var requestObject = null;
    var customer = JSON.parse(paramObj.customer);
    var leadToken = lineItem.custom.postPurchaseLeadToken;
    var order = paramObj.order;

    var plan = getPlanWithLead(paramObj, lineItem);

    requestObject = {
        customer: customer,
        leadToken: leadToken,
        plan: plan,
        transactionDate: order.getCreationDate().valueOf(),
        transactionId: order.orderNo
    };

    return requestObject;
}

/**
 * Process Leads Response
 * @param {Object} ordersResponse : API response from contracts endpoint
 * @param {dw.order.Order} order : API order
 */
function contractsAPIprocessLeadsResponse(leadsResponse, order, lineItem) {
    var Transaction = require('dw/system/Transaction');
    var ArrayList = require('dw/util/ArrayList');

    var ordersLI = order.productLineItems;
    var isLead = false;
    var extendContractIds = [];

    if (leadsResponse.id) {
        for (var i = 0; i < ordersLI.length; i++) {
            var pLi = ordersLI[i];
            isLead = (lineItem.getManufacturerSKU() === pLi.getManufacturerSKU()) &&
                    (lineItem.custom.postPurchaseLeadToken === pLi.custom.postPurchaseLeadToken);
            if (isLead) {
                Transaction.wrap(function () {
                    extendContractIds = ArrayList(pLi.custom.extendContractId || []);
                    extendContractIds.add(leadsResponse.id);
                    pLi.custom.extendContractId = extendContractIds;
                });
            }
        }
    }
}

/**
 * Get leads request object to make a call via Orders API
 * @param {Object} lineItem - leads offer line item
 * @returns {Object} - request object
 */
function ordersAPIgetLeadsOfferPayload(lineItem) {
    var requestObject = null;

    var plan = {
        purchasePrice: Math.ceil(moneyToCents(lineItem.adjustedNetPrice.divide(lineItem.quantityValue))),
        id: lineItem.getManufacturerSKU()
    };

    requestObject = {
        leadToken: lineItem.custom.postPurchaseLeadToken,
        quantity: +lineItem.quantityValue,
        plan: plan
    };

    return requestObject;
}

/**
 * Get products payload and make call on products endpoint
 * @param {Array<Product>} productBatch - array of products
 * @returns {Object} - response object
 */
function exportProducts(productBatch) {
    var requestObject = getProductsPayload(productBatch);
    var endpointName = 'products';
    var response = webService.makeServiceCall(endpointName, requestObject);
    return response;
}

/**
 * Get orders payload and make call on orders endpoint
 * @param {Array<Product>} orderBatch - array of products
 * @returns {Object} - response object
 */
function sendOrders(orderBatch) {
    var requestObject = sendOrdersBatch(orderBatch);
    var endpointName = 'ordersBatch';
    var response = webService.makeServiceCall(endpointName, requestObject);
    return response;
}

/**
 * Make call on contract endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createContracts(paramObj) {
    var requestObject = getContractsPayload(paramObj);
    var endpointName = 'contracts';
    var response = webService.makeServiceCall(endpointName, requestObject);
    return response;
}

/**
 * Make call on refund contract endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createRefund(paramObj) {
    var endpointName = 'refund';
    var response = webService.makeServiceCall(endpointName, paramObj);
    return response;
}

/**
 * Make call on refunds contract endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createOrderApiRefunds(paramObj) {
    var requestObject = getContractID(paramObj);
    var endpointName = 'refunds';
    var response = webService.makeServiceCall(endpointName, requestObject);
    return response;
}

/**
 * Make call on offer endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function getOffer(paramObj) {
    var endpointName = 'offer';
    var response = webService.makeServiceCall(endpointName, paramObj);
    return response;
}

/**
 * Make call on orders endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createOrders(paramObj) {
    var requestObject = getOrdersPayload(paramObj);
    var endpointName = 'orders';
    var apiMethod = 'orders';
    var response = webService.makeServiceCall(endpointName, requestObject, apiMethod);
    return response;
}

/**
 * Make call to contracts endpoint // Contracs API
 * @param {Object} paramObj - object with id of contract and commit type
 */
function contractsAPIcreateLeadContractId(paramObj) {
    var order = paramObj.order;
    var endpointName = 'contracts';

    var requestObject = null;
    var leadsResponse = null;

    var ordersLineItems = order.getProductLineItems();
    for (var i = 0; i < ordersLineItems.length; i++) {
        var lineItem = ordersLineItems[i];
        if (lineItem.custom.postPurchaseLeadToken) {
            for (var k = 0; k < lineItem.quantityValue; k++) {
                requestObject = contractsAPIgetLeadsOfferPayload(paramObj, lineItem);
                leadsResponse = webService.makeServiceCall(endpointName, requestObject);
                if (leadsResponse) {
                    contractsAPIprocessLeadsResponse(leadsResponse, order, lineItem);
                }
            }
        }
    }
}

/**
 * Make call to orders endpoint // Orders API
 * @param {Object} paramObj - object with id of contract and commit type
 */
function ordersAPIcreateLeadContractId(paramObj) {
    var order = paramObj.order;
    var endpointName = 'orders';
    var apiMethod = 'orders';

    var requestObject = null;
    var leadsResponse = null;

    var ordersLineItems = order.getProductLineItems();
}

/**
 * Creates object of items to creates a request
 * @param {Array} products - array of products
 */
function shippingOfferGetItems(products) {
    var collections = require('*/cartridge/scripts/util/collections');

    var items = [];

    for (var i = 0; i < products.length; i++) {
        var product = products[i];

        var item = {};

        var dividedPurchasePrice = product.adjustedNetPrice.divide(product.quantityValue);

        item.referenceId = product.getProductID();
        item.quantity = product.quantityValue;
        item.purchasePrice = Math.ceil(moneyToCents(dividedPurchasePrice));
        item.productName = product.productName;

        items.push(item);
    }

    return items;
}


/**
 * Make call to SHIPPING OFFERS API to creates the quotes
 * @param {string} storeID - storeID
 * @param {Array} products - array of product in cart
 */
function createsShippingOfferQutes(storeID, products) {
    var endpointName = 'shippingOffers';
    var apiMethod = 'shippingOffers';

    var items = shippingOfferGetItems(products);

    var requestObject = {
        storeId: storeID,
        currency: 'USD',
        items: items
    };

    var response = webService.makeServiceCall(endpointName, requestObject);

    // return response and cart items in Extend format
    var returnedData = {};

    returnedData.response = response;
    returnedData.items = items;

    return returnedData;
}

module.exports = {
    exportProducts: exportProducts,
    createContracts: createContracts,
    createRefund: createRefund,
    sendOrders: sendOrders,
    createOrderApiRefunds: createOrderApiRefunds,
    getOffer: getOffer,
    createOrders: createOrders,
    contractsAPIcreateLeadContractId: contractsAPIcreateLeadContractId,
    ordersAPIcreateLeadContractId: ordersAPIcreateLeadContractId,
    createsShippingOfferQutes: createsShippingOfferQutes
};
