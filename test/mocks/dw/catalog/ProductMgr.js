'use strict';

var SeekableIterator = require('./../util/SeekableIterator');
var Product = require('./Product');
var products = [
 new Product()
];

class ProductMgr {
    queryProductsInCatalog(catalog) {
        return new SeekableIterator(products);
    }
}

module.exports = new ProductMgr;
