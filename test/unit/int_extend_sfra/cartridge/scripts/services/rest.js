'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../mocks/';
var logger = require(mockPath + 'dw/system/logger');
var Site = require(mockPath + 'dw/system/Site');

var LocalServiceRegistry = require(mockPath + 'dw/svc/LocalServiceRegistry');
var params = require(mockPath + 'restServices/paramDataMock');
var HashMap = require(mockPath + 'dw/util/HashMap');
var mocks = require(mockPath + 'restServices/restMocks');

var rest = proxyquire(cartridgePath + 'cartridge/scripts/services/rest.js', {
    'dw/system/Logger': logger,
    'dw/system/Site': Site,
    'dw/svc/LocalServiceRegistry': LocalServiceRegistry,
    'dw/util/HashMap': HashMap,
    './restMocks': mocks
});

describe('rest', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('makeServiceCall()', () => {
        it('should return response object from service call: endpoint - contracts', () => {
            var endpoint = 'contracts';
            var result = rest.makeServiceCall(endpoint, params.contractReqData);
            assert.exists(result.id);
        });

        it('should return response object from service call: endpoint - products', () => {
            var endpoint = 'products';
            var result = rest.makeServiceCall(endpoint, params.productMock);
            assert.exists(result.added);
            assert.exists(result.updated);
        });

        it('should return response object from service call: endpoint - refund', () => {
            var endpoint = 'refund';
            var result = rest.makeServiceCall(endpoint, {extendContractId: '123456', commit: true});
            assert.exists(result.id);
        });

        it('should return response error from service call: endpoint - refund', () => {
            var endpoint = 'refund';
            var result = rest.makeServiceCall(endpoint, {id: '123456', commit: true});
            assert.exists(result.error);
            assert.exists(result.errorMessage);
        });

        it('should return response error from service call: endpoint - not definded', () => {
            var result = rest.makeServiceCall('refunds', {extendContractId: '123456', commit: true});
            assert.exists(result.error);
            assert.exists(result.errorMessage);
        });
    });

});