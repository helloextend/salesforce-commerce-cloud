'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../mocks/';
var logger = require(mockPath + 'dw/system/logger');
var Site = require(mockPath + 'dw/system/Site');
var LocalServiceRegistry = require(mockPath + 'dw/svc/LocalServiceRegistry');
var webService = require(mockPath + 'restServices/createRequests');
var params = require(mockPath + 'restServices/paramDataMock');

var extend = proxyquire(cartridgePath + 'cartridge/scripts/extend.js', {
    'dw/system/Logger': logger,
    'dw/system/Site': Site,
    'dw/svc/LocalServiceRegistry': LocalServiceRegistry,
    '~/cartridge/scripts/services/rest': webService
});

describe('extend services', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('createContract()', () => {
        it('should return response object with id of contract', () => {
            var result = extend.createContract(params.createContractParamMock);
            assert.exists(result.id);
            assert.isNotTrue(result.error);
        });

        it('should return response error', () => {
            var result = extend.createContract(params.createContractWrongParamMock);
            assert.isTrue(result.error);
        });

        it('should return response error: No results found', () => {
            var result = extend.createProduct(params.createProductMissedParamMock);
            assert.isTrue(result.error);
        });
    });

    describe('getOffer()', () => {
        it('should return response object with plans', () => {
            var result = extend.getOffer(params.getOfferParamMock);
            assert.exists(result.plans);
            assert.isNotTrue(result.error);
        });

        it('should return response error', () => {
            var result = extend.getOffer(params.getOfferWrongParamMock);
            assert.isTrue(result.error);
        });

        it('should return response error: No results found', () => {
            var result = extend.getOffer(params.getOfferMissedParamMock);
            assert.isTrue(result.error);
        });
    });

    describe('createProduct()', () => {
        it('should return response object with sync arrays of product by types', () => {
            var result = extend.createProduct(params.createProductParamMock);
            assert.exists(result.added);
            assert.exists(result.updated);
            assert.isNotTrue(result.error);
        });

        it('should return response error', () => {
            var result = extend.createProduct(params.createProductWrongParamMock);
            assert.isTrue(result.error);
        });

        it('should return response error: No results found', () => {
            var result = extend.createProduct(params.createProductMissedParamMock);
            assert.isTrue(result.error);
        });
    });

});