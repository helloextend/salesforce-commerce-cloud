'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../mocks/';

var Status = require(mockPath + 'dw/system/Status');
var logger = require(mockPath + 'dw/system/logger');
var extend = require(mockPath + 'restServices/createRequests');
var Order = require(mockPath + 'dw/order/Order');

var jobHelpers = require(mockPath + 'scripts/jobHelpers');
var CustomObjectMgr = require(mockPath + 'dw/object/CustomObjectMgr');
var OrderMgr = require(mockPath + 'dw/order/OrderMgr');
var Transaction = require(mockPath + 'dw/system/Transaction');
var ArrayList = require(mockPath + 'dw/util/ArrayList');

var Collection = require( mockPath + 'dw/util/Collection');
var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');

var createRefunds = proxyquire(cartridgePath + 'cartridge/scripts/jobs/createRefunds.js', {
    'dw/order/Order': Order,
    'dw/system/Status': Status,
    'dw/system/Logger': logger,
    '~/cartridge/scripts/extend': extend,
    '~/cartridge/scripts/jobHelpers': jobHelpers,
    'dw/object/CustomObjectMgr': CustomObjectMgr,
    'dw/order/OrderMgr': OrderMgr,
    'dw/system/Transaction': Transaction,
    'dw/util/ArrayList': ArrayList.toArrayList
});

describe('createRefunds job', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('createRefunds()', () => {
        it('is should return Status OK if contracts created', () => {
            Order.productLineItems = new Collection([
                new ProductLineItem({
                    productID: 'product1',
                    quantityValue: 1,
                    custom: {
                        extendContractId: '1234567',
                        extendRefundStatuses: '{"1234567":"ERROR"}'
                    }
                }),
                new ProductLineItem({
                    productID: 'product2',
                    quantityValue: 1,
                    custom: {
                        extendContractId: '1234567',
                        extendRefundStatuses: ''
                    }
                }),
                new ProductLineItem({
                    productID: 'product3',
                    quantityValue: 1,
                    custom: {
                        extendContractId: 'extend24',
                        extendRefundStatuses: null
                    }
                }),
                new ProductLineItem({
                    productID: 'product3',
                    quantityValue: 1,
                    custom: {
                        extendContractId: '',
                        extendRefundStatuses: null
                    }
                }),
            ]);
            createRefunds.create()
        });

    });

});