'use strict'

var Money = require('./../value/Money');

class PriceAdjustment {
    constructor(price, currency) {
        this.basePrice = new Money(price, currency);
    }

    setPriceValue(newPrice) {
        this.basePrice.vale = newPrice;
    }
}

module.exports = PriceAdjustment;
