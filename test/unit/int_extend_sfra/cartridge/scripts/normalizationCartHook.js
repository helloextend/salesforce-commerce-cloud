/* eslint-disable */
'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../mocks/';
var cartridgePath = '../../../../../cartridges/int_extend_sfra/';
var Transaction = require(mockPath + 'dw/system/Transaction');
var BasketMgr = require(mockPath + 'dw/order/BasketMgr');
var Site = require(mockPath + 'dw/system/Site');
var ArrayList = require('../../../../mocks/dw.util.Collection.js');

var collections = proxyquire(
    '../../../../../cartridges/app_storefront_base/cartridge/scripts/util/collections', {
        'dw/util/ArrayList': ArrayList
    });

var normalizationCartHook = proxyquire(cartridgePath + 'cartridge/scripts/normalizationCartHook.js', {
    'dw/system/Transaction': Transaction,
    'dw/order/BasketMgr': BasketMgr,
    '*/cartridge/scripts/util/collections': collections,
});
// dw.system.Site.current.preferences.custom.extendGlobalSwitch
describe('normalizationCartHook', () => {
    global.dw = {
        system: {
            Site: {
                current: Site.getCurrent()
            }
        }
    }

    global.empty = function (val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    describe('normalizeCartQuantities()', () => {
        it('should return PST time', () => {
            assert.isUndefined(normalizationCartHook());
        });
    });

});