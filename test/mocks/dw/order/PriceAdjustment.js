'use strict'

var Money = require('./../value/Money');

class PriceAdjustment {
    constructor(price, currency) {
        this.basePrice = new Money(price, currency);
    }
}

module.exports = PriceAdjustment;
