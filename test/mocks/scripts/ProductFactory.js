'use strict';

var ProductLineItem = require('./../dw/order/ProductLineItem');

class ProductFactory {
    get(params) {
        if (params.pview === 'productLineItem') {
            if (params.lineItem.bonusProductLineItemUUID) {
                params.bonusProductLineItemUUID = params.lineItem.bonusProductLineItemUUID;
            }
            return new ProductLineItem(params);
        }
        return;
    }
}
module.exports = new ProductFactory;