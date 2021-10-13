/* eslint-disable valid-jsdoc */
/* eslint-disable no-undef */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
/* eslint-disable new-cap */
'use strict';

/* Module Imports */
var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var mocks = require('./restMocks');

/**
 * Inits service instance for specific Extend operation
 * @param {Object} configObj - configuration object
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function createServiceCall(configObj) {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var ACCESS_TOKEN = Site.getCustomPreferenceValue('extendAccessToken');
            var API_VERSION = Site.getCustomPreferenceValue('extendAPIVersion').value;
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            // Set request params
            var params = configObj.params.entrySet();
            for (var i = 0; i < params.length; i++) {
                service.addParam(params[i].key, params[i].value);
            }

            // Set request method
            service.setRequestMethod(configObj.method);

            // Set request endpoint
            service.setURL(credential.URL + configObj.endpoint);

            logger.debug('Endpoint: {1} Request: {0}', requestData, configObj.endpoint);

            return requestData;
        },
        parseResponse: function (service, httpClient) {
            logger.debug('Endpoint: {1} Response: {0}', httpClient.text, configObj.endpoint);
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
            return JSON.parse(configObj.mock);
        }
    });
}

/**
 * @param {string} endpoint - name of API endpoint
 * @param {Object} requestObject - payload object for request
 * @returns {Object} configObj - configuration object
 */
function createRequestConfiguration(endpoint, requestObject) {
    var HashMap = require('dw/util/HashMap');
    var mocks = require('~/cartridge/scripts/services/restMocks');
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');

    var configObj = {};
    configObj.params = new HashMap();

    switch (endpoint) {
        case 'products':
            configObj.endpoint = 'stores/' + STORE_ID + '/products';
            configObj.method = 'POST';
            configObj.mock = mocks.productsResponseMock;
            configObj.params.put('batch', true);
            configObj.params.put('upsert', true);
            break;

        case 'contracts':
            configObj.endpoint = 'stores/' + STORE_ID + '/contracts';
            configObj.method = 'POST';
            configObj.mock = mocks.contractsResponseMock;
            break;

        case 'refund':
            configObj.method = 'POST';
            configObj.params.put('commit', requestObject.commit);
            configObj.endpoint = 'stores/' + STORE_ID + '/contracts/' + requestObject.extendContractId + '/refund';
            break;

        default:
            break;
    }

    return configObj;
}

/**
 * @param {string} endpointName - name of API endpoint
 * @param {Object} requestObject - payload object for request
 * @returns {Object} - response object
 */
function makeServiceCall(endpointName, requestObject) {
    var configObj = createRequestConfiguration(endpointName, requestObject);
    var requestStr = JSON.stringify(requestObject);
    var serviceRequest = createServiceCall(configObj);
    var serviceResponse = serviceRequest.call(requestStr);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Request failed! Error: {0}; Code: {1}; REQUEST: {2}',
            serviceResponse.errorMessage,
            serviceResponse.error,
            serviceRequest.URL
        );
        return {
            error: true,
            errorMessage: serviceResponse.errorMessage || 'No results found.',
            errorCode: serviceResponse.error
        };
    }

    return serviceResponse.object;
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
            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=default');
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
    makeServiceCall: makeServiceCall
};
