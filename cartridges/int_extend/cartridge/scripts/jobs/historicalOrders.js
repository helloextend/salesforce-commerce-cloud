/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var ArrayList = require('dw/util/ArrayList');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site').getCurrent();

/**
 * @function execute
 * @returns {dw.system.Status} - status
 */
exports.execute = function () {
    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;
    if (apiMethod !== 'ordersAPI') {
        logger.info('Current API version should be orders API. Current version is {0}', apiMethod);
    }

    // Current time
    var currentTime = new Date();

    // Time from which orders are collected
    var startingDate = new Date();
    startingDate.setFullYear(startingDate.getFullYear() - 2);

    var historicalOrder = OrderMgr.searchOrders(
        'creationDate <= {0} AND creationDate >= {1}',
        'creationDate desc',
        currentTime,
        startingDate
    );

    var ordersBatch = new ArrayList();

    logger.info('{0} historical orders have been found', historicalOrder.getCount());

    while (historicalOrder.hasNext()) {
        var currentOrder = historicalOrder.next();

        ordersBatch.push(currentOrder);

        var orderLogObject = jobHelpers.getOrdersLoggerModel(currentOrder);
        logger.info(JSON.stringify(orderLogObject));

        if (ordersBatch.length === 10) {
            extend.sendOrders(ordersBatch);
            ordersBatch.clear();
        }
    }

    if (ordersBatch.length) {
        extend.sendOrders(ordersBatch);
    }

    historicalOrder.close();

    return new Status(Status.OK, 'OK', 'Historical orders sending job completed');
};
