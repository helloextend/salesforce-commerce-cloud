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
 * Returns a response object from Extend
 *
 * @param {Object} paramData - query params
 * @returns {Object} - response object
 */
function createLead(paramData) {
    var serviceResponse = null;

    serviceResponse = webService.createLeadRequest(paramData);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Request failed! Error: {0}; Code: {1}; REQUEST: {2}stores/{3}/leads',
            serviceResponse.errorMessage,
            serviceResponse.error,
            serviceURL,
            Site.getCustomPreferenceValue('extendStoreID')
        );
        return {
            error: true,
            errorMessage: serviceResponse.errorMessage || 'No results found.',
            errorCode: serviceResponse.error
        };
    }

    return serviceResponse.object;
}

/* Exported Methods */
module.exports = {
    createLead: createLead,
    exportProducts: exportProducts,
    createContracts: createContracts,
    createRefund: createRefund
};
