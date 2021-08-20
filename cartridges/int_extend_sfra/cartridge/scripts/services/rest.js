/* eslint-disable new-cap */
'use strict';

/* Module Imports */
var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var mocks = require('./restMocks')

/**
 * Inits service instance for specific Extend operation
 * @param {Array<Product>} productBatch - array of products
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function createProductObj(productBatch) {
    var requestObject = [];

    productBatch.forEach(function (product) {
        var EXTEND_IMAGE_VIEW_TYPE = Site.getCustomPreferenceValue('extendImageViewType');

        try {
            var category = '';
            if (product.isVariant()) {
                category = !empty(product.getMasterProduct().getPrimaryCategory()) ? product.getMasterProduct().getPrimaryCategory().getID() : '';
            } else {
                category = !empty(product.getPrimaryCategory()) ? product.getPrimaryCategory().getID() : '';
            }
            requestObject.push({
                brand: product.getBrand(),
                category: category,
                description: !empty(product.getShortDescription()) ? product.getShortDescription().getMarkup() : '',
                imageUrl: product.getImage(EXTEND_IMAGE_VIEW_TYPE, 0) ? product.getImage(EXTEND_IMAGE_VIEW_TYPE, 0).getAbsURL().toString() : '',
                mfrWarranty: {
                    parts: product.custom.mfrWarrantyParts,
                    labor: product.custom.mfrWarrantyLabor
                },
                price: product.priceModel.price.available && product.priceModel.price.value > 0 ? Math.round(product.priceModel.price.value * 100) : 0,
                title: product.getName(),
                referenceId: product.getID(),
                parentReferenceId: product.isVariant() ? product.getMasterProduct().getID() : '',
                identifiers: {
                    sku: product.getID(),
                    upc: product.getUPC()
                }
            });
        } catch (error) {
            logger.error('Request object could not be created. {0}', error);
        }
    });

    return JSON.stringify(requestObject);
}

/**
 * Inits service instance for specific Extend operation
 * @param {dw.object.CustomObject} orderCO - instance of ExtendContractsQueue object
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function createContractObj(orderCO) {
    var customer = JSON.parse(orderCO.custom.customer);
    var product = JSON.parse(orderCO.custom.product);
    var plan = JSON.parse(orderCO.custom.plan);

    var requestObject = {
        transactionId: orderCO.custom.orderNo,
        transactionTotal: orderCO.custom.orderTotal,
        transactionDate: orderCO.getCreationDate().valueOf(),
        customer: customer,
        product: product,
        currency: orderCO.custom.currency,
        plan: plan
    };

    return JSON.stringify(requestObject);
}


/**
 * Inits service instance for specific Extend operation
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function Products() {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request params
            service.addParam('batch', true);
            service.addParam('upsert', true);

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL + 'stores/' + STORE_ID + '/products');

            logger.debug('Extend Create Product Request: {0}', requestData);
            return requestData;
        },
        parseResponse: function (service, httpClient) {
            logger.debug('Extend Create Product Response: {0}', httpClient.text);
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        },
        mockFull: function (service, httpClient) {
            return JSON.parse(mocks.productsResponseMock);
        }
    });
}


/**
 * Inits service instance for specific Extend operation
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function Contracts() {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL + 'stores/' + STORE_ID + '/contracts');

            logger.debug('Extend Create Contract Request: {0}', requestData);

            return requestData;
        },
        parseResponse: function (service, httpClient) {
            logger.debug('Extend Create Contract Response: {0}', httpClient.text);
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        },
        mockFull: function (service, httpClient) {
            return JSON.parse(mocks.contractsResponseMock);
        }
    });
}


/**
 * Inits service instance for specific Extend operation
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function Offers() {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, productId) {
            var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var credential = service.configuration.credential;
            var requestObject = {};

            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request method
            service.setRequestMethod('GET');

            // Set request endpoint
            service.setURL(credential.URL + 'offers?storeId=' + STORE_ID + '&productId=' + productId);

            logger.debug('Extend Get Offers Request: {0}', JSON.stringify(requestObject));
            return JSON.stringify(requestObject);
        },
        parseResponse: function (service, httpClient) {
            logger.debug('Extend Get Offers Response: {0}', httpClient.text);
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        },
        mockFull: function (service, httpClient) {
            return JSON.parse(mocks.offersResponseMock);
        }
    });
}

/**
 * Inits service instance for specific Extend operation
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
 function Refunds() {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request method
            service.setRequestMethod('POST');

            // Set query param
            service.addParam('commit', requestData.commit)

            // Set request endpoint
            service.setURL(credential.URL + 'stores/' + STORE_ID + '/contracts/' + requestData.extendContractId + '/refund');

            logger.debug('Extend Create Refund Request: {0}', requestData);

            return requestData;
        },
        parseResponse: function (service, httpClient) {
            logger.debug('Extend Get Offers Response: {0}', httpClient.text);
            return JSON.parse(httpClient.text);
        },
        filterLogMessage: function () {
            return;
        },
        getRequestLogMessage: function () {
            return;
        },
        getResponseLogMessage: function () {
            return;
        },
        mockFull: function (service, httpClient) {
            return;
        }
    });
}

/** Exports function wrappers */
module.exports = {
    createContractRequest: function (contractCO) {
        var requestStr = createContractObj(contractCO);
        return Contracts().call(requestStr);
    },
    getOfferRequest: function (productId) {
        return Offers().call(productId);
    },
    createProductRequest: function (requestData) {
        var requestStr = createProductObj(requestData);
        return Products().call(requestStr);
    },
    createRefundRequest: function (requestData) {
        return Refunds().call(requestData);
    }
};
