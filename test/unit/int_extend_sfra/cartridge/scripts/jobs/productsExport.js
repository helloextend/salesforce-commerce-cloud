'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../mocks/';

var ProductMgr = require(mockPath + 'dw/catalog/ProductMgr');
var Status = require(mockPath + 'dw/system/Status');
var logger = require(mockPath + 'dw/system/logger');
var extend = require(mockPath + 'restServices/createRequests');
var jobHelpers = require(mockPath + 'scripts/jobHelpers'); 

describe('productsExport job', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('productsExport()', () => {
        it('is should return Status OK if products exported: 100 products', () => {
            var productsExport = proxyquire(cartridgePath + 'cartridge/scripts/jobs/productsExport.js', {
                'dw/catalog/ProductMgr': new ProductMgr(99),
                'dw/system/Status': Status,
                'dw/system/Logger': logger,
                '~/cartridge/scripts/extend': extend,
                '~/cartridge/scripts/jobHelpers': jobHelpers
            });
            assert.isOk(productsExport.execute());
        });

        it('is should return Status OK if products exported: 99 products', () => {
            var productsExport = proxyquire(cartridgePath + 'cartridge/scripts/jobs/productsExport.js', {
                'dw/catalog/ProductMgr': new ProductMgr(98),
                'dw/system/Status': Status,
                'dw/system/Logger': logger,
                '~/cartridge/scripts/extend': extend,
                '~/cartridge/scripts/jobHelpers': jobHelpers
            });
            assert.isOk(productsExport.execute());
        });

    });

});