'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../mocks/';
var logger = require(mockPath + 'dw/system/logger');
var Site = require(mockPath + 'dw/system/Site');

var LocalServiceRegistry = require(mockPath + 'dw/svc/LocalServiceRegistry');
var params = require(mockPath + 'restServices/paramDataMock');

var rest = proxyquire(cartridgePath + 'cartridge/scripts/services/rest.js', {
    'dw/system/Logger': logger,
    'dw/system/Site': Site,
    'dw/svc/LocalServiceRegistry': LocalServiceRegistry
});

describe('rest services', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('createContractRequest()', () => {
        it('should return response object with id of contract', () => {
            var result = rest.createContractRequest(params.contractReqData);
            assert.exists(result.object);
            assert.isTrue(result.ok);
        });
    });

    describe('getOfferRequest()', () => {
        it('should return response object with plans', () => {
            var result = rest.getOfferRequest(params.getOfferMock);
            assert.exists(result.object);
            assert.isTrue(result.ok);
        });
    });

    describe('createProductRequest()', () => {
        it('should return response object with sync arrays of product by types', () => {
            var result = rest.createProductRequest(params.productsRestMock);
            assert.exists(result.object);
            assert.isTrue(result.ok);
        });
    });

});