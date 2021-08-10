'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../mocks/';

var jobHelpers = proxyquire(cartridgePath + 'cartridge/scripts/jobHelpers.js', {});

describe('jobHelpers Helpers', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('getPSTtime()', () => {
        it('should return PST timestamp', () => {
            assert.isNumber(Date.parse(jobHelpers.getPSTtime()))
        });
    });

    describe('getProductLoggerModel()', () => {
        it('should return product object for service call', () => {
            var Product = require(mockPath + 'dw/catalog/Product');
            var product = new Product();
            var result = jobHelpers.getProductLoggerModel(product)

            var loggerModel = {
                ID: '1234567',
                title: 'test product',
                price: 20,
                timestampPST: result.timestampPST
            };

            assert.deepEqual(result, loggerModel);
        });
    });

    describe('getContractLoggerModel()', () => {
        it('should return contract object for service call: !empty(customerProfile)', () => {
            var order = require(mockPath + 'dw/order/Order');
            var result = jobHelpers.getContractLoggerModel(order)

            var loggerModel = {
                orderNumber: '345021307483&',
                customerFirstName: 'Amanda',
                customerLastName: 'Jones',
                timestampPST: result.timestampPST
            };

            assert.deepEqual(result, loggerModel);
        });

        it('should return contract object for service call: empty(customerProfile)', () => {
            var order = require(mockPath + 'dw/order/Order');
            order.customer.profile = null;
            var result = jobHelpers.getContractLoggerModel(order)

            var loggerModel = {
                orderNumber: '345021307483&',
                customerFirstName: 'Amanda',
                customerLastName: 'Jones',
                timestampPST: result.timestampPST
            };

            assert.deepEqual(result, loggerModel);
        });
    });

});