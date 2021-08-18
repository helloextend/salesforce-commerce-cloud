/* eslint-disable linebreak-style */
/* global module */

const ProductMgr = require('dw/catalog/ProductMgr');
var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var jobHelpers = require('~/cartridge/scripts/jobHelpers'); 
var ArrayList = require('dw/util/ArrayList');

/**
 * @function execute
 * @returns {dw.system.Status}
 * @author mdinca
 */

exports.execute = function () {
    var productsIterator = ProductMgr.queryAllSiteProducts();
    var productsBatch = new ArrayList();

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
            extend.exportProducts(productsBatch);
            productsBatch.clear();
        }
    }

    if (productsBatch.length) {
        extend.exportProducts(productsBatch);
    }

    productsIterator.close();

    return new Status(Status.OK, 'OK', 'Products Export job completed');
};
