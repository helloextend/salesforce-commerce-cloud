/* eslint-disable no-undef */
/* eslint-disable new-cap */
/* eslint-disable no-continue */
/* eslint-disable no-loop-func */
'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

/**
 * Adding advanced functionality for working with API
 */
server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site').getCurrent();
    var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var extend = require('~/cartridge/scripts/extend');
    var processAPIhelpers = require('~/cartridge/scripts/helpers/processAPIhelpers');

    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;
    var extendStoreID = Site.getCustomPreferenceValue('extendStoreID');

    var viewData = res.getViewData();

    if (viewData.error) {
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID);
    var orderToken = order.getOrderToken();

    if (!apiMethod) {
        // Warns that the order has not sent to Extend via logger
        logger.warn('You should send orderNo {0} info to Extend manually', viewData.orderID);

        // Warns that the order has not sent to Extend via order custom attribute (see BM order's attribute)
        Transaction.wrap(function () {
            order.custom.extendOrderStatus = 'The current order has not been sent to the Extend. You should send the order info to Extend manually';
        });

        return next();
    }

    // Resolves an order using the orderNumber and orderToken.
    order = OrderMgr.getOrder(viewData.orderID, orderToken);

    var customer = processAPIhelpers.getCustomer(order);

    if (apiMethod === 'contractsAPIonSchedule') {
        processAPIhelpers.createContractsCO(order, viewData.orderID);
        extend.contractsAPIcreateLeadContractId({ order: order, customer: customer });
    } else if (apiMethod === 'ordersAPIonOrderCreate') {
        var ordersResponse = extend.createOrders({ order: order, customer: customer });
        if (!empty(ordersResponse.lineItems)) {
            processAPIhelpers.processOrdersResponse(ordersResponse, order);
        }
        processAPIhelpers.markOrderAsSent(order);
        extend.ordersAPIcreateLeadContractId({ order: order, customer: customer });
    } else if (apiMethod === 'ordersAPIonSchedule') {
        processAPIhelpers.createExtendOrderQueue(order, viewData.orderID);
        processAPIhelpers.addXMLAdditionsOrdersAPIonSchedule(order, extendStoreID);
    }
    return next();
});

module.exports = server.exports();
