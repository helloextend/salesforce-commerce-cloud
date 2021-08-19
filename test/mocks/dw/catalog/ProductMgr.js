'use strict';

var SeekableIterator = require('./../util/SeekableIterator');
var Product = require('./Product');
var Variant = require('./Variant');
var ProductLineItem = require('./../order/ProductLineItem')

function getProductsBatch(num) {
    var products = [];

    for (var i = 0; i < num; i++) {
        products.push(new Product());
    }
    return products;
}


class ProductMgr {
    constructor(allSiteProducts) {
        this.allSiteProducts = allSiteProducts;
    }

    queryProductsInCatalog(catalog) {
        var productsBatch = getProductsBatch(1)
        return new SeekableIterator(productsBatch);
    }
    queryAllSiteProducts() {
        var productsBatch = getProductsBatch(this.allSiteProducts)
        productsBatch.push(new Variant())
        productsBatch.push(new ProductLineItem())
        return new SeekableIterator(productsBatch);
    }
}

module.exports = ProductMgr;
