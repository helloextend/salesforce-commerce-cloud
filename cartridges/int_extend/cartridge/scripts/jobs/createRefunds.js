/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var jobHelpers = require('~/cartridge/scripts/jobHelpers');

/**
 * @function create
 * @returns {dw.system.Status} - status
 */
exports.create = function () {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Site = require('dw/system/Site').getCurrent();
    var Transaction = require('dw/system/Transaction');
    var refundStatus = jobHelpers.refundStatus;
    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    var canceledOrders = OrderMgr.searchOrders(
        'status={0} AND custom.extendRefundStatus!={1} AND custom.extendRefundStatus!={2} AND custom.extendRefundStatus!={3} AND custom.extendRefundStatus!={4} AND custom.extendRefundStatus!={5}',
        'creationDate desc',
        Order.ORDER_STATUS_CANCELLED,
        refundStatus.SUCCESS,
        refundStatus.REJECT,
        refundStatus.refund_quated,
        refundStatus.refund_paid,
        refundStatus.refund_denied
    );

    logger.info('{0} canceled orders have been found', canceledOrders.getCount());

    while (canceledOrders.hasNext()) {
        var currentOrder = canceledOrders.next();

        for (var i = 0; i < currentOrder.productLineItems.length; i++) {
            var pLi = currentOrder.productLineItems[i];
            var extendContractIds;
            var statuses;
            var extendRefundStatuses = JSON.parse(pLi.custom.extendRefundStatuses) || {};
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

                var statusesCondition = extendRefundStatuses &&
                                        (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                                        extendRefundStatuses[extendContractId] === refundStatus.REJECT ||
                                        extendRefundStatuses[extendContractId] === refundStatus.refund_paid ||
                                        extendRefundStatuses[extendContractId] === refundStatus.refund_denied);

                if (statusesCondition) {
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

                var response = null;

                if (apiMethod === 'ordersAPI') {
                    paramObj.isOrdersApi = true;
                    response = extend.createOrderApiRefunds(paramObj);
                } else {
                    response = extend.createRefund(paramObj);
                }

                if (response.error) {
                    // An error has been occurred during service call
                    extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                    continue;
                }

                if (apiMethod !== 'ordersAPI') {
                    if (response.refundAmount.amount === 0) {
                        logger.info('An Extend contract №{0} has not been refunded due to the refund amount', extendContractId);
                        extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                    } else if (response.refundAmount.amount > 0) {
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
                } else {
                    extendRefundStatuses[extendContractId] = response.status;
                }
            }

            Transaction.wrap(function () {
                pLi.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
            });
        }
        var orderRefundStatus = jobHelpers.getRefundStatus(currentOrder, apiMethod);

        Transaction.wrap(function () {
            currentOrder.custom.extendRefundStatus = orderRefundStatus;
        });
    }

    canceledOrders.close();

    return new Status(Status.OK, 'OK', 'Create Refunds from SFCC job completed');
};
