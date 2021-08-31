'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../mocks/';
var logger = require(mockPath + 'dw/system/logger');
var Site = require(mockPath + 'dw/system/Site');
var LocalServiceRegistry = require(mockPath + 'dw/svc/LocalServiceRegistry');
var webService = require(mockPath + 'restServices/makeServiceCall');
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
    
    describe('createContracts()', () => {
        it('should return response object with created extend contract information: default API ver.', () => {
            var result = extend.createContracts(params.contractReqData);
            assert.exists(result.object);
        });

        it('should return response object with created extend contract information: 2021-04-01 API ver.', () => {
            Site.preferenceMap.extendAPIVersion.value = '2021-04-01'
            var result = extend.createContracts(params.contractReqData);
            assert.exists(result.object);
        });

        it('should return response object with created extend contract information: 2020-04-01 API ver.', () => {
            Site.preferenceMap.extendAPIVersion.value = '2020-04-01'
            var result = extend.createContracts(params.contractReqData);
            assert.exists(result.object);
        });
    });

    describe('exportProducts()', () => {
        it('should return response object with sync arrays of product by types: 2020-04-01 API ver.', () => {
            var result = extend.exportProducts(params.productsRestMock);
            assert.exists(result.object.added);
            assert.exists(result.object.updated);
            assert.isNotTrue(result.error);
        });

        it('should return response object with sync arrays of product by types: default API ver.', () => {
            Site.preferenceMap.extendAPIVersion.value = 'default'
            var result = extend.exportProducts(params.productsRestMock);
            assert.exists(result.object.added);
            assert.exists(result.object.updated);
            assert.isNotTrue(result.error);
        });
    });

    describe('createRefund()', () => {
        it('should return response object with refunded extend contract information', () => {
            var productLimeItemId = '1234567N'
            var result = extend.createRefund(productLimeItemId);
            assert.exists(result.object);
        });
    });

});