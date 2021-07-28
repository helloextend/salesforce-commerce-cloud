/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');

/**
 * @function create
 * @returns {dw.system.Status}
 */
exports.create = function () {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var ArrayList = require('dw/util/ArrayList');
    var Transaction = require('dw/system/Transaction');

    var canceledOrders = OrderMgr.searchOrders(
        'status={0}',
        'creationDate desc',
        Order.ORDER_STATUS_CANCELLED
    );

    logger.info('{0} canceled orders have been found', canceledOrders.getCount());

    while (canceledOrders.hasNext()) {
        var currentOrder = canceledOrders.next();

        for (var i = 0; i < currentOrder.productLineItems.length; i++) {
            var pLi = currentOrder.productLineItems[i];
            var extendContractIds;

            if (!pLi.custom.extendContractId.length) {
                continue;
            } else {
                extendContractIds = ArrayList(pLi.custom.extendContractId);
            }

            for (var j = 0; j < pLi.custom.extendContractId.length; j++) {
                var extendContractId = pLi.custom.extendContractId[j];

                logger.info(
                    'An Extend contract №{0} has been found in the order №{1}',
                    extendContractId,
                    currentOrder.getOrderNo()
                );

                var paramObj = {
                    extendContractId: extendContractId,
                    commit: false
                }

                var response = extend.createRefund(paramObj);

                if (response.error) {
                    // An error has been occurred during service call
                    continue;
                }

                if (response.refundAmount.amount === 0) {
                    logger.info('An Extend contract №{0} has not been refunded due to the refund amount', extendContractId);
                    extendContractIds.remove(extendContractId);
                    // Place to notify customer logic

                } else if (response.refundAmount.amount > 0) {
                    paramObj.commit = false;
                    response = extend.createRefund(paramObj);

                    if (response.id) {
                        logger.info('An Extend contract №{0} has been successfully refunded ', extendContractId);
                        extendContractIds.remove(extendContractId)
                    } else {
                        // Error has been occured during service call
                        continue;
                    }
                }
            }

            Transaction.wrap(function () {
                pLi.custom.extendContractId = extendContractIds;
            });
        }
    }

    canceledOrders.close();

    return new Status(Status.OK, 'OK', 'Create Refunds from SFCC job completed');
};
