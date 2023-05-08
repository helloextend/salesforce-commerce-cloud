/* eslint-disable no-continue */
/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var ArrayList = require('dw/util/ArrayList');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');
var historicalOrdersJobHelpers = require('~/cartridge/scripts/jobs/helpers/historicalOrdersJobHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site').getCurrent();

/**
 * @function execute
 * @returns {dw.system.Status} - status
 */
exports.execute = function () {
    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    // Determine whether API method is Orders API
    var orderApiMethod = (apiMethod === 'ordersAPIonOrderCreate') || (apiMethod === 'ordersAPIonSchedule');
    if (!orderApiMethod) {
        logger.info('Current API version should be orders API. Current version is {0}', apiMethod);
    }

    // Current time
    var currentTime = new Date();

    // Time from which orders are collected
    var startingDate = new Date();
    startingDate.setFullYear(startingDate.getFullYear() - 2);

    var orderExtendStatus = 'The current order has been sent to the Extend';

    var historicalOrder = OrderMgr.searchOrders(
        'creationDate <= {0} AND creationDate >= {1} AND custom.extendOrderStatus !={2}',
        'creationDate desc',
        currentTime,
        startingDate,
        orderExtendStatus.trim()
    );

    if (historicalOrder.getCount() === 0) {
        return new Status(Status.OK, 'OK', 'Production orders have already been integrated to Extend. The historical import has been canceled');
    }

    var ordersBatch = new ArrayList();

    logger.info('{0} historical orders have been found', historicalOrder.getCount());

    while (historicalOrder.hasNext()) {
        var currentOrder = historicalOrder.next();

        var doesOrderHaveExtensions = historicalOrdersJobHelpers.doesOrderHaveExtensions(currentOrder);

        // In case of the order has any extensions the job should skip that order
        if (doesOrderHaveExtensions) {
            continue;
        }

        ordersBatch.push(currentOrder);

        if (!ordersBatch.length) {
            return new Status(Status.OK, 'OK', 'Production orders have already been integrated to Extend. The historical import has been canceled');
        }

        var orderLogObject = jobHelpers.getOrdersLoggerModel(currentOrder);
        logger.info(JSON.stringify(orderLogObject));

        if (ordersBatch.length === 10) {
            extend.sendHistoricalOrders(ordersBatch);
            ordersBatch.clear();
        }
    }

    if (ordersBatch.length) {
        extend.sendHistoricalOrders(ordersBatch);
    }

    historicalOrder.close();

    return new Status(Status.OK, 'OK', 'Historical orders sending job completed');
};
