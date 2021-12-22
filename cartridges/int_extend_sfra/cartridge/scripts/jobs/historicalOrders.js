/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var ArrayList = require('dw/util/ArrayList');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site').getCurrent();

/**
 * @function execute
 * @returns {dw.system.Status} - status
 */
exports.execute = function () {
    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;
    if (apiMethod !== ordersAPI)
    var currentTime = new Date();
    var twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    var historicalOrder = OrderMgr.searchOrders(
        'creationDate <= {0} AND creationDate >= {1} AND status!={2}',
        'creationDate desc',
        currentTime,
        twoYearsAgo,
        Order.ORDER_STATUS_CANCELLED
    );

    var productsBatch = new ArrayList();

    logger.info('{0} canceled orders have been found', historicalOrder.getCount());

    while (historicalOrder.hasNext()) {
        var currentOrder = historicalOrder.next();

        for (var i = 0; i < currentOrder.productLineItems.length; i++) {
            var pLi = currentOrder.productLineItems[i];
            productsBatch.push(pLi);

            if (productsBatch.length === 100) {
                // export orders extend. 
                productsBatch.clear();
            }
        }
    }

    if (productsBatch.length) {
        // export orders extend. 
    }

    return new Status(Status.OK, 'OK', 'Historical orders sending job completed');
};
