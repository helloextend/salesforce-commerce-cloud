'use strict'

var Money = require('./../value/Money');

class GiftCertificateLineItem {
    constructor() {
        this.UUID = 'some UUID';

        this.basePrice = new Money(20,'USD');
        this.price = new Money(20,'USD');
        this.custom = {};
        this.giftCertificateID = '1234567';
    }

    setPriceValue(newValue) {
        this.priceValue = newValue;
    }
}

module.exports = GiftCertificateLineItem;
