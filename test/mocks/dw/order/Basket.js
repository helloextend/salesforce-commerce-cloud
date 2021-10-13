'use strict';
/* eslint-disable no-unused-vars */

var ProductLineItem = require('./ProductLineItem');
var ProductQuantities = require('./ProductQuantities');
var GiftCertificateLineItem = require('./GiftCertificateLineItem');
var PaymentInstrument = require('./PaymentInstrument');
var Shipment = require('./Shipment');
var Money = require('./../value/Money');
var Collection = require('./../util/Collection');
var OrderAddress = require('./OrderAddress');
var PriceAdjustment = require('./PriceAdjustment');

class Basket {
    constructor() {
        this.paymentInstruments = [];
        this.paymentStatus = 0;
        this.status = 0;
        this.shipments = [];
        this.customerEmail = 'test';
        this.billingAddress = new OrderAddress();
        this.custom = {};
        this.exportStatus = 0;

        this.defaultShipment = new Shipment();
        this.totalGrossPrice = new Money(250.00, 'USD');
        this.productLineItems = new Collection([
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: true,
                optionProductLineItem: false,
                productID: 'product1',
                adjustedGrossPrice: new Money(15, 'USD'),
                adjustedNetPrice: new Money(13, 'USD'),
                quantityValue: 1,
                UUID: '654321U'
            }),
            new ProductLineItem({
                bonusProductLineItem: true,
                bundledProductLineItem: false,
                optionProductLineItem: true,
                productID: 'product2',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '123456U',
                custom: {
                    persistentUUID: '111custom'
                }
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: '1234567',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '7891011U',
                custom: {
                    parentLineItemUUID: '24851custom'
                }
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                optionProductLineItem: true,
                productID: 'product3',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '67891011U'
            }),
            new ProductLineItem({
                bonusProductLineItem: true,
                bundledProductLineItem: false,
                optionProductLineItem: false,
                productID: 'product3',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '7891011U',
                priceAdjustments: new Collection(new PriceAdjustment(11.77, 'USD'))
            }),
            new ProductLineItem({
                bonusProductLineItem: true,
                bundledProductLineItem: false,
                optionProductLineItem: false,
                productID: 'product3',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '7891011U',
                priceAdjustments: new Collection()
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                optionProductLineItem: false,
                productID: 'product3',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '7891011U',
                product: null
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                optionProductLineItem: false,
                productID: 'product3',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                UUID: '7891011U'
            })
        ]);
        this.allProductLineItems = this.productLineItems;
        this.giftCertificateLineItems = new Collection([
            new GiftCertificateLineItem(),
            new GiftCertificateLineItem()
        ])
    }

    getProductLineItems() {
        return this.allProductLineItems;
    }

    getAllProductLineItems() {
        return this.allProductLineItems;
    }

    updateTotals() {
        return;
    }

    getGiftCertificateLineItems() {
        return this.giftCertificateLineItems;
    }

    getPaymentInstruments() {
        var index = 0;
        return {
            items: this.paymentInstruments,
            iterator: () => {
                return {
                    items: this.paymentInstruments,
                    hasNext: () => {
                        return index < this.paymentInstruments.length;
                    },
                    next: () => {
                        return this.paymentInstruments[index++];
                    }
                };
            },
            toArray: () => {
                return this.paymentInstruments;
            }
        };
    }

    createPaymentInstrument(paymentMethodId, amount) {
        var paymentInstrument = new PaymentInstrument(paymentMethodId, amount);

        this.paymentInstruments.push(paymentInstrument);

        return paymentInstrument;
    }

    removePaymentInstrument() {
        return true;
    }

    getShipments() {
        var index = 0;
        return {
            items: this.shipments,
            iterator: () => {
                return {
                    items: this.shipments,
                    hasNext: () => {
                        return index < this.shipments.length;
                    },
                    next: () => {
                        return this.shipments[index++];
                    }
                };
            }
        };
    }

    createShipment(shipment) {
        this.shipments.push(shipment);
        return shipment;
    }

    getCustomer() {
        return {};
    }

    getCustomerEmail() {
        return this.customerEmail;
    }

    getBillingAddress() {
        return this.billingAddress;
    }

    setCustomerEmail(emailAddress) {
        return {};
    }

    getProductQuantities() {
        return new ProductQuantities();
    }
}

module.exports = new Basket;
