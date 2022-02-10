/* eslint-disable valid-jsdoc */
/* eslint-disable no-continue */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
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
    var apiVersion = Site.getCustomPreferenceValue('extendAPIVersion').value;
    var defaultPayload = getContractsDefaultPayload(paramObj);

    if (apiVersion === 'default') {
        return defaultPayload;
    }

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

    if (apiVersion === '2021-04-01') {
        requestObject.isTest = true;
    }

    return requestObject;
}

/**
 * Get products payload for specific API version
 * @param {ArrayList<Product>} productBatch - array of products
 * @returns {Array} requestObject - payload object for request
 */
function getProductsPayload(productBatch) {
    var apiVersion = Site.getCustomPreferenceValue('extendAPIVersion').value;
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

            if (apiVersion !== 'default') {
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
    var warrantyCounter = 0;
    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
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

            if (productLi.custom.isWarrantable) {
                pliObj.warrantable = true;
                lineItems.push(pliObj);
                break;
            }

            if (!warrantiesArray.length && productLi.custom.persistentUUID) {
                pliObj.warrantable = true;
                lineItems.push(pliObj);
                break;
            }

            pliObj.warrantable = true;

            while (warrantiesArray.length) {
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
    var order = paramObj.order;
    var customer = JSON.parse(paramObj.customer);
    var defaultShipment = order.getDefaultShipment();
    var defaultShippingAddress = defaultShipment.getShippingAddress();
    var requestObject = {};

    requestObject.storeId = STORE_ID;
    requestObject.storeName = 'SFCC';

    requestObject.currency = order.getCurrencyCode();
    requestObject.customer = getCustomer(customer, defaultShippingAddress);

    requestObject.isTest = true;

    requestObject.total = Math.ceil(moneyToCents(order.getTotalGrossPrice()));
    requestObject.transactionId = order.orderNo;
    requestObject.lineItems = getLineItems(order);
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
 * Get contracts payload and make call on contracts endpoint
 * @param {dw.object.CustomObject} paramObj - instance of ExtendContractsQueue object
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

module.exports = {
    exportProducts: exportProducts,
    createContracts: createContracts,
    createRefund: createRefund,
    createOrderApiRefunds: createOrderApiRefunds,
    getOffer: getOffer,
    createOrders: createOrders
};
