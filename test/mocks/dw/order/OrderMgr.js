'use strict';

/* eslint-disable */
var Order = require('./Order');
var Status = require('./../system/Status');
var SeekableIterator = require('./../util/SeekableIterator');

 class OrderMgr {
    getOrder() {
        return Order;
    }
    
    placeOrder(order) {
        order.status = Order.ORDER_STATUS_NEW;
        return Status.OK;
    }
    
    failOrder(order) {
        order.status = Order.ORDER_STATUS_FAILED;
        return Status.OK;
    }
    
    cancelOrder(order) {
        order.status = Order.ORDER_STATUS_CANCELLED;
        return Status.OK;
    }

    searchOrders(query, ORDER_BY, startDate, endDate) {
        var orders = new SeekableIterator([
            Order,
            Order
        ]);
        return orders;
    };
}

module.exports =new OrderMgr;
