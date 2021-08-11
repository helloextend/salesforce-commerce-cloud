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
        it('createContractObj(): should return array of modified object', () => {
            var result = rest.createContractRequest(params.createContractReqData);
        });
    });

});