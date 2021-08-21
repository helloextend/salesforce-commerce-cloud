'use strict';

var Quantity = require('./Quantity');

class Money {
    constructor(value = 0, currencyCode) {
        this.currencyCode = currencyCode;
        this.value = value;
        this.available = true;
    }

    add(money) {
        return (money instanceof Money) ?
            new Money(this.value + money.value, this.currencyCode) :
            new Money(this.value + value, this.currencyCode);
    }

    subtract(money) {
        return new Money(this.value - money.value, this.currencyCode);
    }

    multiply(factor) {
        return (factor instanceof Quantity) ?
            new Money(this.value + factor.value, this.currencyCode) :
            new Money(this.value + factor, this.currencyCode);
    }

    divide(divisor) {
        return new Money(this.value/divisor, this.currencyCode);
    }

    getAmount() {
        return this;
    }

    getValueOrNull() {
        return this.value;
    }

    toFormattedString() {
        return this.value + ' ' +this.currencyCode;
    }

    toNumberString() {
        return +this.value;
    }

    getDecimalValue() {
        return this.value;
    }

    getValue() {
        return this.value;
    }
}

module.exports = Money;
