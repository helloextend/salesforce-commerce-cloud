'use strict';
/* eslint-disable no-unused-vars */

var ProductLineItem = require('./ProductLineItem');
var PaymentInstrument = require('./PaymentInstrument');
var Shipment = require('./Shipment');
var Money = require('./../value/Money');
var Collection = require('./../util/Collection');
var OrderAddress = require('./OrderAddress');

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
                bundledProductLineItem: false,
                productID: 'product1',
                adjustedGrossPrice: new Money(15,'USD'),
                adjustedNetPrice: new Money(13,'USD'),
                quantityValue: 1
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product2',
                adjustedGrossPrice: new Money(30,'USD'),
                adjustedNetPrice: new Money(27,'USD'),
                quantityValue: 2
            })
        ]);
        this.allProductLineItems = this.productLineItems;
    }

    getProductLineItems() {
        return this.allProductLineItems;
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



}

module.exports = new Basket;
