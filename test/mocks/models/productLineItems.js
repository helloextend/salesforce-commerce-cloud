'use strict';

var ProductLineItem = require('./../dw/order/ProductLineItem');
var OptionProductLineItem = require('./../dw/order/OptionProductLineItem');
var Collection = require('./../dw/util/Collection');

//Product Line Items for productLineItems model
var options = new Collection([new OptionProductLineItem(), new OptionProductLineItem()]);

var lineItem = new ProductLineItem({
    optionProductLineItems: options
});

var extendLineItem = new ProductLineItem({
    optionProductLineItems: options,
    custom: {
        parentLineItemUUID: '1234567N'
    }
});

var lineItemNoProduct = new ProductLineItem({
    optionProductLineItems: options,
    product: null
});

var bonusLineItem = new ProductLineItem({
    optionProductLineItems: options,
    bonusProductLineItemUUID: 'notbonus',
});

var lineItemBonusProduct = new ProductLineItem({
    bonusProductLineItem: null,
    optionProductLineItems: options,
    custom: {
        bonusProductLineItemUUID: '1234567N',
        preOrderUUID: '1234567N'
    }
});

var productLineItems = new Collection([
    lineItem, extendLineItem,
    lineItemNoProduct, lineItemBonusProduct,
    bonusLineItem
]);

module.exports = {
    productLineItems: productLineItems
}