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
        it('should return PST time', () => {
            var currentTime = new Date();
            var PST_offset = 8;

            currentTime.setHours(currentTime.getHours() - PST_offset);
            assert.equal(Date.parse(jobHelpers.getPSTtime()), Date.parse(currentTime));
        });
    });

    describe('getProductLoggerModel()', () => {
        it('should return product object for service call', () => {
            var Product = require(mockPath + 'dw/catalog/Product');
            var product = new Product();

            console.log(product.ID)
            var result = {
                ID: product.ID,
                title: product.name,
                price: 20,
                timestampPST: jobHelpers.getPSTtime().getTime()
            };

            assert.deepEqual(jobHelpers.getProductLoggerModel(product), result);
        });
    });

    describe('getContractLoggerModel()', () => {
        it('should return contract object for service call', () => {
            var order = require(mockPath + 'dw/order/Order');
            var expte

            var result = {
                orderNumber: order.getOrderNo(),
                customerFirstName: 'firstName',
                customerLastName: 'lastName',
                timestampPST: jobHelpers.getPSTtime().getTime()
            };

            assert.deepEqual(jobHelpers.getContractLoggerModel(order), result);
        });
    });

});