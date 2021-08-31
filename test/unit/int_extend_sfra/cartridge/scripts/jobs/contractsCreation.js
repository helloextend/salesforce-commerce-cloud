'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../mocks/';

var Status = require(mockPath + 'dw/system/Status');
var logger = require(mockPath + 'dw/system/logger');
var extend = require(mockPath + 'restServices/createRequests');

var jobHelpers = require(mockPath + 'scripts/jobHelpers');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var OrderMgr = require(mockPath + 'dw/order/OrderMgr');
var Transaction = require(mockPath + 'dw/system/Transaction');
var ArrayList = require(mockPath + 'dw/util/ArrayList');

var contractsCreation = proxyquire(cartridgePath + 'cartridge/scripts/jobs/contractsCreation.js', {
    'dw/system/Status': Status,
    'dw/system/Logger': logger,
    '~/cartridge/scripts/extend': extend,
    '~/cartridge/scripts/jobHelpers': jobHelpers,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/order/OrderMgr': OrderMgr,
    'dw/system/Transaction': Transaction,
    'dw/util/ArrayList': ArrayList.toArrayList
});

describe('contractsCreation job', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('contractsCreation()', () => {
        it('is should return Status OK if contracts created', () => {
            assert.isOk(contractsCreation.create());
        });
    });

});