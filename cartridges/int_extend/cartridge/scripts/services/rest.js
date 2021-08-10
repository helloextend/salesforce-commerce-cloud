/* eslint-disable new-cap */
'use strict';

/* Module Imports */
var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');

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
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function createContractObj(orderCO) {
    var customer = JSON.parse(orderCO.getCustom().customer);
    var product = JSON.parse(orderCO.getCustom().product);
    var plan = JSON.parse(orderCO.getCustom().plan);

    var requestObject = {
        transactionId: orderCO.getCustom().orderNo,
        transactionTotal: orderCO.getCustom().orderTotal,
        transactionDate: orderCO.getCreationDate().valueOf(),
        customer: customer,
        product: product,
        currency: orderCO.getCustom().currency,
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
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion');
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request params
            service.addParam('batch', true);
            service.addParam('upsert', true);

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL + 'stores/' + STORE_ID + '/products');

            return requestData;
        },
        parseResponse: function (service, httpClient) {
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
            return JSON.parse(
                {
                    action: 'Extend-Test',
                    queryString: '',
                    locale: 'en_US',
                    added: [

                    ],
                    conflicts: [

                    ],
                    updated: [
                        {
                            parentReferenceId: 'id9',
                            createdAt: 1574771568,
                            brand: 'brand9',
                            storeId: 'aff7dfea-fc04-4e41-a5db-64c389b9ecab',
                            enabled: false,
                            approved: false,
                            imageUrl: 'https://www.google.com/',
                            updatedAt: 1574771568,
                            identifiers: {
                                upc: '9001',
                                gtin: '9000',
                                asin: '9002',
                                sku: 'test9',
                                barcode: '9003'
                            },
                            category: 'category9',
                            mfrWarranty: {
                                parts: 12,
                                url: 'http://example.com',
                                labor: 12
                            },
                            description: 'description9',
                            price: 100,
                            title: 'Produc9',
                            referenceId: 'id9',
                            plans: [

                            ]
                        },
                        {
                            parentReferenceId: 'id10',
                            createdAt: 1574771568,
                            brand: 'brand7',
                            storeId: 'aff7dfea-fc04-4e41-a5db-64c389b9ecab',
                            enabled: false,
                            approved: false,
                            imageUrl: 'https://www.google.com/',
                            updatedAt: 1574771568,
                            identifiers: {
                                upc: '10001',
                                gtin: '10000',
                                asin: '10002',
                                sku: 'test10',
                                barcode: '10003'
                            },
                            category: 'category7',
                            mfrWarranty: {
                                parts: 14,
                                url: 'http://example.com',
                                labor: 14
                            },
                            description: 'description7',
                            price: 200,
                            title: 'Produc10',
                            referenceId: 'id10',
                            plans: [

                            ]
                        }
                    ],
                    errors: [

                    ]
                }
            );
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
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion');
            var credential = service.configuration.credential;
            var requestObject = {};

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL + 'stores/' + STORE_ID + '/contracts');

            // Create request object
            requestObject = createContractObj(requestData);

            return JSON.stringify(requestObject);
        },
        parseResponse: function (service, httpClient) {
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
            return JSON.parse(
                {
                    id: 'cc957cb3-3d5d-430b-90a2-9ec96ee4c3cf',
                    sellerId: 'bb123cb3-5f5d-999b-87a2-7yy88ee4c4tz',
                    sellerName: 'Acme Corp',
                    createdAt: 1557267465,
                    updatedAt: 1557267556,
                    transactionId: '99999999',
                    poNumber: 'ABC-123',
                    transactionTotal: 14999,
                    customer: {
                        phone: '123-456-7890',
                        email: 'BobRoss@gmail.com',
                        name: 'Bob Ross',
                        address: {
                            address1: '535 Mission Street',
                            address2: '11th Floor',
                            city: 'San Francisco',
                            countryCode: 'USA',
                            postalCode: '94526',
                            provinceCode: 'CA'
                        }
                    },
                    product: {
                        referenceId: 'SKU-123-456',
                        purchasePrice: 14999,
                        manufacturerWarrantyLength: 12,
                        manufacturerWarrantyLengthParts: 123456,
                        manufacturerWarrantyLengthLabor: 123456,
                        serialNumber: 'ABCD123456'
                    },
                    currency: 'USD',
                    transactionDate: 1563388069,
                    plan: {
                        purchasePrice: 499,
                        planId: '10001-misc-elec-adh-replace-1y'
                    },
                    status: 'live'
                }
            );
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
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion');
            var credential = service.configuration.credential;
            var requestObject = {};

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request method
            service.setRequestMethod('GET');

            // Set request endpoint
            service.setURL(credential.URL + 'offers?storeId=' + STORE_ID + '&productId=' + productId);

            return JSON.stringify(requestObject);
        },
        parseResponse: function (service, httpClient) {
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
            return JSON.parse(
                {
                    plans: [
                        {
                            id: 'AmazingAppliancePlan',
                            price: 199,
                            contract: {
                                coverage_starts: 'immediate',
                                coverage_includes: 'adh',
                                service_type: 'replace',
                                replacement_type: 'new',
                                deductible: 0,
                                term_length: 36
                            },
                            url: 'string'
                        }
                    ]
                }
            );
        }
    });
}

/**
 * Inits service instance for specific Extend operation
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
 function Leads() {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion');

            if (API_VERSION === 'default') {
                API_VERSION = '2021-04-01';
            }

            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request method
            service.setRequestMethod('POST');

            // Set request endpoint
            service.setURL(credential.URL + 'stores/' + STORE_ID + '/leads');

            logger.debug('Extend Post Leads Request: {0}', requestData);
            return requestData;
        },
        parseResponse: function (service, httpClient) {
            logger.debug('Extend Post Leads Response: {0}', httpClient.text);
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

/**
 * Inits service instance for specific Extend operation
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
 function Refunds() {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion');
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
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
        logger.debug('Extend Create Contract Request: {0}', requestStr);
        return Contracts().call(requestStr);
    },
    getOfferRequest: function (productId) {
        return Offers().call(productId);
    },
    createProductRequest: function (requestData) {
        var requestStr = createProductObj(requestData);
        logger.debug('Extend Create Product Request: {0}', requestStr);
        return Products().call(requestStr);
    },

    createLeadRequest: function (requestData) {
        return Leads().call(requestData);
    },

    createRefundRequest: function (requestData) {
        return Refunds().call(requestData);
    }
};
