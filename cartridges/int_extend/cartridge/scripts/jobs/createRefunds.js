/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');

/**
 * Returns status
 * @function create
 * @returns {dw.system.Status} - status
 */
exports.create = function () {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    // eslint-disable-next-line no-unused-vars
    var ArrayList = require('dw/util/ArrayList');
    var Transaction = require('dw/system/Transaction');
    var refundStatus = jobHelpers.refundStatus;

    var canceledOrders = OrderMgr.searchOrders(
        'status={0} AND custom.extendRefundStatus!={1} AND custom.extendRefundStatus!={2}',
        'creationDate desc',
        Order.ORDER_STATUS_CANCELLED,
        refundStatus.SUCCESS,
        refundStatus.REJECT
    );

    logger.info('{0} canceled orders have been found', canceledOrders.getCount());

    while (canceledOrders.hasNext()) {
        var currentOrder = canceledOrders.next();

        for (var i = 0; i < currentOrder.productLineItems.length; i++) {
            var pLi = currentOrder.productLineItems[i];
            var extendContractIds;
            var statuses;
            var extendRefundStatuses = JSON.parse(pLi.custom.extendRefundStatuses) || {};
            // eslint-disable-next-line no-redeclare
            var statuses = Object.keys(extendRefundStatuses);

            if (!pLi.custom.extendContractId.length || (!statuses && !statuses.length)) {
                continue;
            } else if (statuses.length) {
                extendContractIds = statuses;
            } else {
                extendContractIds = pLi.custom.extendContractId;
            }

            for (var j = 0; j < extendContractIds.length; j++) {
                var extendContractId = extendContractIds[j];

                if (
                    extendRefundStatuses &&
                    (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                    extendRefundStatuses[extendContractId] === refundStatus.REJECT)
                ) {
                    continue;
                }

                logger.info(
                    'An Extend contract №{0} has been found in the order №{1}',
                    extendContractId,
                    currentOrder.getOrderNo()
                );

                var paramObj = {
                    extendContractId: extendContractId,
                    commit: false
                };

                var response = extend.createRefund(paramObj);

                if (response.error) {
                    // An error has been occurred during service call
                    extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                    continue;
                }

                if (response.refundAmount.amount === 0) {
                    logger.info('An Extend contract №{0} has not been refunded due to the refund amount', extendContractId);
                    extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                } else if (response.refundAmount.amount > 0) {
                    // paramObj.commit = false for testing
                    paramObj.commit = true;
                    response = extend.createRefund(paramObj);

                    if (response.id) {
                        logger.info('An Extend contract №{0} has been successfully refunded ', extendContractId);
                        extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                    } else {
                        // Error has been occured during service call
                        extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                        continue;
                    }
                }
            }

            Transaction.wrap(function () {
                pLi.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
            });
        }
        var orderRefundStatus = jobHelpers.getRefundStatus(currentOrder);

        Transaction.wrap(function () {
            currentOrder.custom.extendRefundStatus = orderRefundStatus;
        });
    }

    canceledOrders.close();

    return new Status(Status.OK, 'OK', 'Create Refunds from SFCC job completed');
};
