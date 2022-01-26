/* eslint-disable no-undef */
/* eslint-disable valid-jsdoc */
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

            if (configObj.API_VERSION) {
                API_VERSION = configObj.API_VERSION;
            }

            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            service.addHeader('X-Extend-Access-Token', ACCESS_TOKEN);

            if (configObj.XIdempotencyKey) {
                service.addHeader('X-Idempotency-Key', configObj.XIdempotencyKey);
            }

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
    var UUIDUtils = require('dw/util/UUIDUtils');
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

        case 'refunds':
            configObj.method = 'POST';
            configObj.params.put('commit', requestObject.commit);
            configObj.endpoint = 'refunds';
            configObj.API_VERSION = '2021-07-01';
            break;

        case 'offer':
            configObj.endpoint = 'offers?storeId=' + STORE_ID + '&productId=' + requestObject.pid;
            configObj.method = 'GET';
            configObj.mock = mocks.offersResponseMock;
            break;

        case 'orders':
            configObj.endpoint = 'orders';
            configObj.method = 'POST';
            configObj.extendMethod = 'orders';
            configObj.API_VERSION = '2021-07-01';
            configObj.XIdempotencyKey = UUIDUtils.createUUID();
            configObj.mock = mocks.ordersResponseMock;
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

module.exports = {
    makeServiceCall: makeServiceCall
};
