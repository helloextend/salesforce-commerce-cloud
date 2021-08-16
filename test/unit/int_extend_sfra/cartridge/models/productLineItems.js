'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../mocks/';

var URLUtils = require(mockPath + 'dw/web/URLUtils');
var Resource = require(mockPath + 'dw/web/Resource');
var collections = require(mockPath + 'util/collections');
var ProductFactory = require(mockPath + 'scripts/ProductFactory');

var params = require(mockPath + 'models/productLineItems');

var ProductLineItems = proxyquire(cartridgePath + 'cartridge/models/productLineItems.js', {
    'dw/web/URLUtils': URLUtils,
    'dw/web/Resource': Resource,
    '*/cartridge/scripts/factories/product': ProductFactory,
    '*/cartridge/scripts/util/collections': collections
});

describe('productLineItems model', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('ProductLineItems()', () => {
        it('is should return object with array of items and number of total quantity', () => {
            var result = new ProductLineItems(params.productLineItems, 'order')
            assert.isAbove(result.items.length, 0);
            assert.isAbove(result.totalQuantity, 0);
        });

        it('is should return object with empty array of items and number of total quantity equil to zero', () => {
            var result = new ProductLineItems(null, 'order')
            assert.equal(result.items.length, 0);
            assert.equal(result.totalQuantity, 0);
        });

        // Extend line item
        it('is should return object with array of items and number of total quantity', () => {
            var result = new ProductLineItems(params.productLineItems, 'basket')
            assert.isAbove(result.items.length, 0);
            assert.isAbove(result.totalQuantity, 0);
        });
    });

});