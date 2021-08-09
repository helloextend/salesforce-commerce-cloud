'use strict'

var basket = require('./Basket');

class BasketMgr {
    constructor() {
        this.currentBasket = basket;
    }
    getCurrentBasket() {
        return this.currentBasket;
    }
}

module.exports = new BasketMgr();