/* eslint-disable no-continue */
/* eslint-disable linebreak-style */
/* global module */

var ProductMgr = require('dw/catalog/ProductMgr');
var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var ArrayList = require('dw/util/ArrayList');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');

/**
 * @function execute
 * @returns {dw.system.Status}
 * @author mdinca
 */

exports.execute = function () {
    var productsIterator = ProductMgr.queryAllSiteProducts();
    var productsBatch = new ArrayList();
    var isRequestValid = null;
    var requestLength = null;

    logger.info('Starting processing new products...');

    while (productsIterator.hasNext()) {
        var product = productsIterator.next();

        if ((product.isProduct() || product.isVariant()) && product.isOnline()) {
            productsBatch.push(product);

            isRequestValid = jobHelpers.isRequestValid(productsBatch).isValid;

            if (isRequestValid) {
                continue;
            } else {
                productsBatch.pop();
                extend.exportProducts(productsBatch);
                requestLength = jobHelpers.isRequestValid(productsBatch).requestLength;

                logger.info('Request length is {0}: ', requestLength);

                productsBatch.clear();
                productsBatch.push(product);
            }

            var productLogObject = jobHelpers.getProductLoggerModel(product);
            logger.info(JSON.stringify(productLogObject));
        } else {
            continue;
        }
    }

    if (productsBatch.length) {
        extend.exportProducts(productsBatch);
    }

    productsIterator.close();

    return new Status(Status.OK, 'OK', 'Products Export job completed');
};
