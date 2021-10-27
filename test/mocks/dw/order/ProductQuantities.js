'use strict'

var Collection = require('./../util/Collection');
var ProductLineItem = require('./ProductLineItem');
var Money = require('./../value/Money');

class ProductQuantities {
    constructor() {
        this.productQuantities = new Collection([
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product1',
                adjustedGrossPrice: new Money(15, 'USD'),
                adjustedNetPrice: new Money(13, 'USD'),
                quantityValue: 1,
                UUID: '654321U'
            }),
            new ProductLineItem({
                bonusProductLineItem: false,
                bundledProductLineItem: false,
                productID: 'product1',
                adjustedGrossPrice: new Money(15, 'USD'),
                adjustedNetPrice: new Money(13, 'USD'),
                quantityValue: 1,
                UUID: '555321U'
            }),
        ]);
    }

    keySet()  {
        return this.productQuantities;
    }

    get () {
        return 1;
    }
}

module.exports = ProductQuantities;