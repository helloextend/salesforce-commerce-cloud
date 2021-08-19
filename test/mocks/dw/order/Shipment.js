'use strict'

var ProductLineItem = require('./ProductLineItem');
var Collection = require('./../util/Collection');
var ShippingMethod = require('./ShippingMethod');
var OrderAddress = require('./OrderAddress');
var Money = require('./../value/Money');

class Shipment {
    constructor(args) {
        this.ID = (args && args.ID) ? args.ID : '0940';
        this.productLineItems = new Collection([new ProductLineItem]);
        this.shippingTotalTax = new Money(3, 'USD');
        this.shippingMethod = new ShippingMethod();
        this.shippingTotalPrice = new Money(1, 'USD');
        this.trackingNumber = '000333';
        this.shippingAddress = new OrderAddress();
    }
    getShippingMethod () {
        return this.shippingMethod;
    }
}

module.exports = Shipment;