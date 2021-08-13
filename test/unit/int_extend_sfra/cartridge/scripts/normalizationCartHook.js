/* eslint-disable */
'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../mocks/';
var cartridgePath = '../../../../../cartridges/int_extend_sfra/';
var Transaction = require(mockPath + 'dw/system/Transaction');
var BasketMgr = require(mockPath + 'dw/order/BasketMgr');
var Basket = require(mockPath + 'dw/order/Basket');
var Site = require(mockPath + 'dw/system/Site');
var ArrayList = require('../../../../mocks/util/Collection.js');

var collections = require(mockPath + 'util/collections');

var normalizationCartHook = proxyquire(cartridgePath + 'cartridge/scripts/normalizationCartHook.js', {
    'dw/system/Transaction': Transaction,
    'dw/order/BasketMgr': BasketMgr,
    '*/cartridge/scripts/util/collections': collections,
});

var dw = {
    system: {
        Site: {
            current: Site.getCurrent()
        }
    }
}

describe('normalizationCartHook', () => {
    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    global.dw = dw;

    describe('normalizationCartHook()', () => {
        it('Testing method: normalizationCartHook: !extendGlobalSwitch', () => {
            assert.isUndefined(normalizationCartHook(Basket));
        });

        it('Testing method: normalizationCartHook: extendGlobalSwitch', () => {
            global.dw.system.Site.current.preferences.custom.extendGlobalSwitch = false;
            assert.isUndefined(normalizationCartHook(Basket));
        });

        it('Testing method: normalizationCartHook: !parentLineItemUUID', () => {
            global.dw.system.Site.current.preferences.custom.extendGlobalSwitch = true;
            Basket.productLineItems[2].custom.parentLineItemUUID = 'null';
            assert.isUndefined(normalizationCartHook(Basket));
        });
    });

});