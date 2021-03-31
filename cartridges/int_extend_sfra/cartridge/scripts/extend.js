'use strict';

var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var Site = require('dw/system/Site').getCurrent();
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var webService = require('~/cartridge/scripts/services/rest');

/**
 * Returns a response object from Extend
 *
 * @param {Object} paramData - query params
 * @returns {Object} - response object
 */
function createContract(paramData) {
    var serviceResponse = null;

    serviceResponse = webService.createContractRequest(paramData);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Request failed! Error: {0}; Code: {1}; REQUEST: {2}stores/{3}/contracts',
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


/**
 * Returns a response object from Extend
 *
 * @param {Object} paramData - query params
 * @returns {Object} - response object
 */
function getOffer(paramData) {
    var serviceResponse = null;

    serviceResponse = webService.getOfferRequest(paramData);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Request failed! Error: {0}; Code: {1}; REQUEST: {2}stores/offers?storeId={3}&productId={4}',
            serviceResponse.errorMessage,
            serviceResponse.error,
            serviceURL,
            Site.getCustomPreferenceValue('extendStoreID'),
            paramData.productId
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
 * Returns a response object from Extend
 *
 * @param {Object} paramData - query params
 * @returns {Object} - response object
 */
function createProduct(paramData) {
    var serviceResponse = null;

    serviceResponse = webService.createProductRequest(paramData);

    if (!serviceResponse.ok) {
        var serviceURL = LocalServiceRegistry.createService('int_extend.http.Extend', {}).getURL();
        logger.error(
            'Request failed! Error: {0}; Code: {1}; REQUEST: {2}stores/{3}/products',
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
    createContract: createContract,
    getOffer: getOffer,
    createProduct: createProduct
};
