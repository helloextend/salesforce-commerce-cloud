'use strict';
/* eslint-disable no-unused-vars */
var ProductLineItem = require('./ProductLineItem');
var Money = require('./../value/Money');
var PaymentInstrument = require('./PaymentInstrument');
var Shipment = require('./Shipment');
var Collection = require('./../util/Collection');
var PriceAdjustment = require('./PriceAdjustment');
var OrderAddress = require('./OrderAddress');

class Order {
    constructor() {
        this.paymentInstruments = [
            new PaymentInstrument('paymentInstrumentId1'),
            new PaymentInstrument('paymentInstrumentId2')
        ];
        this.currencyCode = 'USD';
        this.paymentStatus = 0;
        this.status = 0;
        this.shipments = [
            new Shipment({ ID: 'me' })
        ];
        this.customerEmail = 'test@gmail.com';
        this.billingAddress = new OrderAddress();
        this.custom = {};
        this.exportStatus = 0;
        this.orderNo = '345021307483&';
        this.customer = {
            profile: {
                firstName: 'Amanda',
                lastName: 'Jones',
                gender: {
                    value: 1
                },
                getFirstName() {
                    return this.firstName
                },
                getLastName() {
                    return this.lastName
                }
            },
            getProfile() {
                return this.profile;
            }
        };
        this.ProductLineItem = ProductLineItem;
        this.priceAdjustments = new Collection(new PriceAdjustment(11.77, 'USD'));
        this.productLineItems = new Collection([
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product1',
                adjustedGrossPrice: new Money(15, 'USD'),
                adjustedNetPrice: new Money(13, 'USD'),
                quantityValue: 1,
                custom: {
                    extendContractId: '1234567',
                    extendRefundStatuses: '{}'
                }
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product2',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                custom: {
                    extendContractId: ''
                }
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product2',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                custom: {
                    extendContractId: '13141516',
                    extendRefundStatuses: '{}'
                }
            }),
                new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product2',
                adjustedGrossPrice: new Money(30, 'USD'),
                adjustedNetPrice: new Money(27, 'USD'),
                quantityValue: 2,
                custom: {
                    extendContractId: '61234456',
                    extendRefundStatuses: null
                }
            }),
        ]);
        let alltest = this.productLineItems;
        this.defaultShipment = new Shipment({ ID: 'me' });
        this.allProductLineItems = this.productLineItems;
    }

    static setClassConstants() {
        this.CONFIRMATION_STATUS_CONFIRMED = 2;
        this.CONFIRMATION_STATUS_NOTCONFIRMED = 0;
        this.EXPORT_STATUS_EXPORTED = 1;
        this.EXPORT_STATUS_FAILED = 3;
        this.EXPORT_STATUS_NOTEXPORTED = 0;
        this.EXPORT_STATUS_READY = 2;
        this.ORDER_STATUS_CANCELLED = 6;
        this.ORDER_STATUS_COMPLETED = 5;
        this.ORDER_STATUS_CREATED = 0;
        this.ORDER_STATUS_FAILED = 8;
        this.ORDER_STATUS_NEW = 3;
        this.ORDER_STATUS_OPEN = 4;
        this.ORDER_STATUS_REPLACED = 7;
        this.PAYMENT_STATUS_NOTPAID = 0;
        this.PAYMENT_STATUS_PAID = 2;
        this.PAYMENT_STATUS_PARTPAID = 1;
        this.SHIPPING_STATUS_NOTSHIPPED = 0;
        this.SHIPPING_STATUS_PARTSHIPPED = 1;
        this.SHIPPING_STATUS_SHIPPED = 2;
    }
    getOrderNo() {
        return this.orderNo;
    }

    getProductLineItems() {
        return this.productLineItems;
    }

    getAllProductLineItems() {
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

    setPaymentStatus(status) {
        this.paymentStatus = status;
    }

    getPaymentStatus() {
        return this.paymentStatus;
    }

    setExportStatus(status) {
        this.exportStatus = status;
    }

    getExportStatus() {
        return this.exportStatus;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
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
        return this.customer;
    }

    getCustomerEmail() {
        return this.customerEmail;
    }

    getBillingAddress() {
        return this.billingAddress;
    }

    addNote() {
        return true;
    }
    setCustomerEmail(emailAddress) {
        return {};
    }

    getCurrencyCode() {
        return this.currencyCode;
    }
}

Order.setClassConstants();

module.exports = new Order;
