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
    var OrderMgr = require('dw/order/OrderMgr');
    var extend = require('~/cartridge/scripts/extend');
    var processAPIhelpers = require('~/cartridge/scripts/helpers/processAPIhelpers');

    var apiMethod = Site.getCustomPreferenceValue('extendAPIMethod').value;

    var viewData = res.getViewData();

    if (viewData.error) {
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID);
    var orderToken = order.getOrderToken();

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
        extend.ordersAPIcreateLeadContractId({ order: order, customer: customer });
    } else if (apiMethod === 'ordersAPIonSchedule') {
        processAPIhelpers.createExtendOrderQueue(order, viewData.orderID);
    }
    return next();
});

module.exports = server.exports();
