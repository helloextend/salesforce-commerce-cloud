/* eslint-disable */
'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../../mocks/';

var ShippingMgr = require(mockPath + 'dw/order/ShippingMgr');
var ShippingLocation = require(mockPath + 'dw/order/ShippingLocation');
var TaxMgr = require(mockPath + 'dw/order/TaxMgr');
var Logger = require(mockPath + 'dw/system/Logger');
var HashMap = require(mockPath + 'dw/util/HashMap');
var PromotionMgr = require(mockPath + 'dw/campaign/PromotionMgr');
var Status = require(mockPath + 'dw/system/Status');
var HookMgr = require(mockPath + 'dw/system/HookMgr');

var collections = require(mockPath + 'util/collections');
var normalizeCartQuantities = require(mockPath + 'hooks/normalizationCartHook');

var Basket = require(mockPath + 'dw/order/Basket');

var collections = require(mockPath + 'util/collections');

var calculate = proxyquire(cartridgePath + 'cartridge/scripts/hooks/cart/calculate.js', {
    'dw/order/ShippingMgr': ShippingMgr,
    'dw/order/ShippingLocation': ShippingLocation,
    'dw/order/TaxMgr': TaxMgr,
    'dw/system/Logger': Logger,
    'dw/util/HashMap': HashMap,
    'dw/campaign/PromotionMgr': PromotionMgr,
    'dw/system/Status': Status,
    'dw/system/HookMgr': HookMgr,
    '*/cartridge/scripts/normalizationCartHook': normalizeCartQuantities,
    '*/cartridge/scripts/util/collections': collections,
});

describe('calculate hook', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('calculate()', () => {
        it('is should return Status OK if basket calculated', () => {
            assert.isOk(calculate.calculate(Basket));
        });
    });

});