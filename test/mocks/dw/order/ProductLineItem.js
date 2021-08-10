var Product = require('./../catalog/Product');
var Money = require('./../value/Money');
var Quantity = require('./../value/Quantity');

class ProductLineItem {
    constructor(arg) {
        this.ID = '0045001';
        this.bonusProductLineItem = false;
        this.gift = false;
        this.UUID = 'some UUID';
        this.proratedPrice = new Money(17,'USD');
        this.adjustedPrice = new Money(18,'USD');
        this.basePrice = new Money(20,'USD');
        this.price = new Money(20,'USD');
        this.quantity = new Quantity(1);
        this.quantityValue = 1;
        this.productID = '1234567';
        this.product = new Product();

        this.length = {};

        // rewrite properties to incoming values if any exists
        if(arg && arg instanceof Object) {
            for(var key in arg) {
                this[key] = arg[key];
            }
        }
        if (this.custom) {
            this.custom.bonusProductLineItemUUID = '';
        } else {
            this.custom = {bonusProductLineItemUUID: ''};
        }

    }
    getQuantity() {
        return this.quantity;
    }

    getProratedPrice() {
        return this.proratedPrice;
    }

    getProduct() {
        return this.product;
    }

    getUUID() {
        return this.UUID;
    }

    setQuantityValue(newValue) {
        this.quantityValue = newValue;
    }

    getQuantityValue() {
        return this.quantityValue;
    }
}
module.exports = ProductLineItem;
