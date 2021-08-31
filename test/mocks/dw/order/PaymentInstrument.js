'use strict';

var Money = require('./../value/Money');

class PaymentInstrument {
    constructor(paymentMethodId = 'test', amount = 0) {
        this.paymentTransaction = {};
        this.custom = {};
        this.amount = amount;
        this.paymentMethod = paymentMethodId;
        this.paymentProcessor = paymentMethodId;
    }

    static setClassConstants() {
        this.METHOD_BANK_TRANSFER = 'BANK_TRANSFER';
        this.METHOD_BML = 'BML';
        this.METHOD_CREDIT_CARD = 'CREDIT_CARD';
        this.METHOD_DW_ANDROID_PAY = 'DW_ANDROID_PAY';
        this.METHOD_DW_APPLE_PAY = 'DW_APPLE_PAY';
        this.METHOD_GIFT_CERTIFICATE = 'GIFT_CERTIFICATE';
    }

    getPaymentProcessor() {
        return this.paymentProcessor;
    }

    getPaymentMethod() {
        return this.paymentMethod;
    }

    getCustom() {
        return this.custom;
    }

    getPaymentTransaction() {
        return new Money(10);
    }
}

PaymentInstrument.setClassConstants();

module.exports = PaymentInstrument;
