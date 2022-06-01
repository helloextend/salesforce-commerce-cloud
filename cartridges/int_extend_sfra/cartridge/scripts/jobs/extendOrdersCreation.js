/* eslint-disable valid-jsdoc */
/* eslint-disable no-continue */
/* eslint-disable new-cap */
/* eslint-disable no-loop-func */
/* global module */

var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var extend = require('~/cartridge/scripts/extend');
var processAPIhelpers = require('~/cartridge/scripts/helpers/processAPIhelpers');

exports.execute = function () {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');

    var extendOrdersQueue = CustomObjectMgr.getAllCustomObjects('ExtendOrderQueue');

    while (extendOrdersQueue.hasNext()) {
        var queueOrder = extendOrdersQueue.next();
        var orderNo = queueOrder.custom.OrderNo;
        var order = OrderMgr.getOrder(orderNo);
        var customer = processAPIhelpers.getCustomer(order);
        var apiResponse = extend.createOrders({ order: order, customer: customer });

        if (!apiResponse.error) {
            processAPIhelpers.processOrdersResponse(apiResponse, order);

            // Decrement queue
            Transaction.wrap(function () {
                CustomObjectMgr.remove(queueOrder);
            });
        } else {
            logger.debug(JSON.stringify({ errorCode: apiResponse.errorCode, errorMessage: apiResponse.errorMessage }));
            Transaction.wrap(function () {
                queueOrder.custom.log = 'Error Code: ' + apiResponse.errorCode + ', Error Message: ' + apiResponse.errorMessage;
            });
        }
    }

    extendOrdersQueue.close();

    return new Status(Status.OK, 'OK', 'Extend Orders Createion job completed');
};
