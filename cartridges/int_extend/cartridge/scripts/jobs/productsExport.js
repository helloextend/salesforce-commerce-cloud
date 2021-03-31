/* eslint-disable linebreak-style */
/* global module */

const ProductMgr = require('dw/catalog/ProductMgr');
var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var jobHelpers = require('~/cartridge/scripts/jobHelpers'); 

/**
 * @function execute
 * @returns {dw.system.Status}
 * @author mdinca
 */

exports.execute = function () {
    var productsIterator = ProductMgr.queryAllSiteProducts();
    var productsBatch = [];

    logger.info('Starting processing new products...');

    while (productsIterator.hasNext()) {
        var product = productsIterator.next();

        if ((product.isProduct() || product.isVariant()) && product.isOnline()) {
            productsBatch.push(product);

            var productLogObject = jobHelpers.getProductLoggerModel(product);
            logger.info(JSON.stringify(productLogObject));

        } else {
            continue;
        }

        if (productsBatch.length === 100) {
            extend.createProduct(productsBatch);
            productsBatch = [];
        }
    }

    if (productsBatch.length) {
        extend.createProduct(productsBatch);
    }

    productsIterator.close();

    return new Status(Status.OK, 'OK', 'Products Export job completed');
};
