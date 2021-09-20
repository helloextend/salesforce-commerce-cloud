var Product = require('./../catalog/Product');
var ProductPriceModel = require('./../catalog/ProductPriceModel');
var Money = require('./../value/Money');
var Quantity = require('./../value/Quantity');

class ProductLineItem {
    constructor(arg) {
        this.ID = '0045001';
        this.bonusProductLineItem = false;
        this.gift = false;
        this.UUID = '24851';
        this.proratedPrice = new Money(17,'USD');
        this.adjustedPrice = new Money(18,'USD');
        this.basePrice = new Money(20,'USD');
        this.price = new Money(20,'USD');
        this.quantity = new Quantity(1);
        this.quantityValue = 1;
        this.productID = '1234567';
        this.catalogProduct = true;
        this.product = new Product();
        this.priceModel = new ProductPriceModel();

        this.length = {};

        // rewrite properties to incoming values if any exists
        if(arg && arg instanceof Object) {
            for(var key in arg) {
                this[key] = arg[key];
            }
        }
        if (this.custom) {
            this.custom.bonusProductLineItemUUID =  this.custom.bonusProductLineItemUUID || '';
            this.custom.extendRefundStatuses =  this.custom.extendRefundStatuses || '';
        } else {
            this.custom = {
                bonusProductLineItemUUID: '',
                extendRefundStatuses: '{}'
            };
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

    setPriceValue(newValue) {
        this.priceValue = newValue;
    }

    updateOptionPrice() {
        return;
    }

    isProduct() {
        return false;
    }

    isVariant() {
        return false;
    }

}
module.exports = ProductLineItem;
