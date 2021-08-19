'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var cartridgePath = '../../../../../../cartridges/int_extend_sfra/';
var mockPath = './../../../../../mocks/';

var extendAnalyticsHelpers = proxyquire(cartridgePath + 'cartridge/scripts/helpers/extendAnalyticsHelpers.js', {});

describe('extendAnalyticsHelpers Helpers', () => {
    describe('getExtendProduct()', () => {
        it('should extend product from basket', () => {
            var Basket = require(mockPath + 'dw/order/Basket');
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var currentBasket = new Basket();
            var persistentItem = new ProductLineItem();

            var productLineItems = currentBasket.getAllProductLineItems();
            var productLineItem = extendAnalyticsHelpers.getExtendProduct(currentBasket, persistentItem);

            assert.equal(productLineItem.productID, persistentItem.productID);
        });
    });

    describe('getExtendedProduct()', () => {
        it('should extended product from basket', () => {
            var Basket = require(mockPath + 'dw/order/Basket');
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var currentBasket = new Basket();
            var parentLineItem = new ProductLineItem();

            var productLineItems = currentBasket.getAllProductLineItems();
            var productLineItem = extendAnalyticsHelpers.getExtendedProduct(currentBasket, parentLineItem);

            assert.equal(productLineItem.productId, parentLineItem.productId);
        });
    });

    describe('isExtendProduct()', () => {
        it('isExtendProduct correct uuid', () => {
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var productLineItem = new ProductLineItem();
            var uuid = '24851';

            var result = extendAnalyticsHelpers.isExtendProduct(productLineItem, uuid);

            assert.equal(result, true);
        });

        it('isExtendProduct incorrect uuid', () => {
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var productLineItem = new ProductLineItem();
            var uuid = '24851invalid';

            var result = extendAnalyticsHelpers.isExtendProduct(productLineItem, uuid);

            assert.isUndefined(result);
        });
    });

    describe('getOfferUpdatedData()', () => {
        it('should return data for trackOfferUpdated event', () => {
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var updatedProduct = new ProductLineItem();
            var updatedPlan = new ProductLineItem();
            var offerUpdated = extendAnalyticsHelpers.getOfferUpdatedData(updatedProduct, updatedPlan);

            var data = {
                productId: '1234567',
                planId: 'test',
                warrantyQuantity: 1,
                productQuantity: 1,
                event: 'offerUpdated'
            };

            assert.deepEqual(offerUpdated, data);
        });
    });

    describe('getProductUpdatedData()', () => {
        it('should return data for trackProductUpdated event', () => {
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var updatedProduct = new ProductLineItem();
            var productUpdated = extendAnalyticsHelpers.getProductUpdatedData(updatedProduct);

            var data = {
                productId: '1234567',
                productQuantity: 1,
                event: 'productUpdated'
            };

            assert.deepEqual(productUpdated, data);
        });
    });

    describe('getProductRemovedFromCartData()', () => {
        it('should return data for trackProductRemovedFromCart', () => {
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var removedProduct = new ProductLineItem();
            var productRemovedFromCart = extendAnalyticsHelpers.getProductRemovedFromCartData(removedProduct);

            var data = {
                productId: '1234567',
                event: 'productRemovedFromCart'
            };

            assert.deepEqual(productRemovedFromCart, data);
        });
    });

    describe('getOfferRemovedFromCartData()', () => {
        it('should return data for trackOfferRemoverFromCart', () => {
            var ProductLineItem = require(mockPath + 'dw/order/ProductLineItem');
            var removedProduct = new ProductLineItem();
            var removedPlan = new ProductLineItem();
            var offerRemovedFromCart = extendAnalyticsHelpers.getOfferRemovedFromCartData(removedProduct, removedPlan);

            var data = {
                referenceId: '1234567',
                planId: 'test',
                event: 'offerRemovedFromCart'
            };

            assert.deepEqual(offerRemovedFromCart, data);
        });
    });
});