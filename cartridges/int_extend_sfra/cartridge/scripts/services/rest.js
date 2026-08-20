/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
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
function createServiceCall(configObj, accessToken ) {
    return require('dw/svc/LocalServiceRegistry').createService('int_extend.http.Extend', {
        createRequest: function (service, requestData) {
            var API_VERSION = null;
            var extendAPIMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;
            
            var orderApiMethod = (extendAPIMethod === 'ordersAPIonOrderCreate') || (extendAPIMethod === 'ordersAPIonSchedule');

            if (orderApiMethod) {
                API_VERSION = 'latest';
            } else {
                // used '2021-04-01' API version in case of contracts API
                API_VERSION = '2021-04-01';
            }

            var credential = service.configuration.credential;

            // Set request headers
            service.addHeader('Accept', 'application/json; version=' + API_VERSION);
            service.addHeader('Content-Type', 'application/json');
            if (accessToken) service.addHeader('X-Extend-Access-Token', accessToken);

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

            if(accessToken) logger.debug('Endpoint: {1} Request: {0}', requestData, configObj.endpoint);

            return requestData;
        },
        parseResponse: function (service, httpClient) {
            if(accessToken) logger.debug('Endpoint: {1} Response: {0}', httpClient.text, configObj.endpoint);
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
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var UUIDUtils = require('dw/util/UUIDUtils');

    var configObj = {};
    configObj.params = new HashMap();

    switch (endpoint) {
        case 'oauth':
            configObj.endpoint = 'auth/oauth/token';
            configObj.method = 'POST';
            configObj.mock = mocks.oauthResponseMock;
            break;

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
            break;

        case 'offer':
            const product = requestObject.pid;
            const price = requestObject.price;
            const category = requestObject.category;
            const region = request.locale.split('_')[1];
            configObj.endpoint = 'offers?storeId=' + STORE_ID +
                '&productId=' + product + '&category=' + category +
                '&price=' + price +
                '&region=' + region;
            configObj.method = 'GET';
            configObj.mock = mocks.offersResponseMock;
            break;

        case 'orders':
            configObj.endpoint = 'orders';
            configObj.method = 'PUT';
            configObj.extendMethod = 'orders';
            configObj.XIdempotencyKey = UUIDUtils.createUUID();
            configObj.mock = mocks.ordersResponseMock;
            break;

        case 'leads':
            configObj.endpoint = 'leads';
            configObj.method = 'POST';
            break;

        case 'getLeadsInfo':
            configObj.endpoint = 'leads/' + requestObject.leadToken;
            configObj.method = 'GET';
            break;

        case 'historicalOrdersBatch':
            configObj.endpoint = 'orders/batch?historical=true';
            configObj.method = 'POST';
            configObj.extendMethod = 'orders';
            configObj.XIdempotencyKey = UUIDUtils.createUUID();
            break;

        case 'shippingOffersConfig':
            configObj.endpoint = 'shipping-offers/config?storeId=' + STORE_ID;
            configObj.method = 'GET';
            break;

        case 'shippingOffersQuotes':
            configObj.endpoint = 'shipping-offers/quotes';
            configObj.method = 'POST';
            break;

        default:
            break;
    }

    return configObj;
}

/**
 * @param {string} endpointName - name of API endpoint
 * @param {Object} requestObject - payload object for request
 * @param {string} apiMethod - name of API method
 * @returns {Object} - response object
 */
function makeServiceCall(endpointName, requestObject, apiMethod) {
    var configObj = createRequestConfiguration(endpointName, requestObject);
    var requestStr = JSON.stringify(requestObject);
    var ACCESS_TOKEN = getAccessToken().access_token;
    
    var serviceRequest = createServiceCall(configObj, ACCESS_TOKEN);
    var serviceResponse = serviceRequest.call(requestStr);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Request failed! Error: {0}; Code: {1}; REQUEST: {2} BODY: {3}',
            serviceResponse.errorMessage,
            serviceResponse.error,
            serviceRequest.URL,
            requestStr
        );
        return {
            error: true,
            errorMessage: serviceResponse.errorMessage || 'No results found.',
            errorCode: serviceResponse.error
        };
    }

    return serviceResponse.object;
}

function getAccessToken() {
    var configObj = createRequestConfiguration('oauth', null);
    var CLIENT_ID = Site.getCustomPreferenceValue('extendClientID');
    var CLIENT_SECRET = Site.getCustomPreferenceValue('extendClientSecret');

    var requestBody = JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        client_assertion: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
    });
    var serviceRequest = createServiceCall(configObj);
    var serviceResponse = serviceRequest.call(requestBody);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Failed to get access token. Error: {0}; Code: {1}; REQUEST: {2}',
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
