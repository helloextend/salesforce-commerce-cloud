/* eslint-disable no-continue */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
'use strict';

function getPSTtime() {
    var currentTime = new Date();
    var PST_offset = 8;

    currentTime.setHours(currentTime.getHours() - PST_offset);

    return currentTime;
}

function getProductLoggerModel(product) {
    var result = {};

    result.ID = product.ID;
    result.title = product.name;
    result.price = product.priceModel.getPrice().getValue();
    result.timestampPST = getPSTtime().getTime();

    return result;
}

function getContractLoggerModel(order) {
    var result = {};
    var customerProfile = order.getCustomer().getProfile();

    result.orderNumber = order.getOrderNo();
    result.customerFirstName = !empty(customerProfile) ? customerProfile.getFirstName() : order.defaultShipment.shippingAddress.firstName;
    result.customerLastName = !empty(customerProfile) ? customerProfile.getLastName() : order.defaultShipment.shippingAddress.lastName;
    result.timestampPST = getPSTtime().getTime();

    return result;
}

var refundStatus = {
    SUCCESS: 'SUCCESS',
    REJECT: 'REJECT',
    ERROR: 'ERROR',
    REJECT_AND_ERROR: 'REJECT_AND_ERROR'
};

function getRefundStatus(order) {
    var error = false;
    var reject = false;

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        if (!pLi.custom.extendRefundStatuses) {
            continue;
        }

        var extendRefundStatuses = JSON.parse(pLi.custom.extendRefundStatuses);
        var statuses = Object.keys(extendRefundStatuses);

        for (var j = 0; j < statuses.length; j++) {
            var contract = statuses[j];
            var status = extendRefundStatuses[contract];

            if (status === refundStatus.ERROR) {
                error = true;
            } else if (status === refundStatus.REJECT) {
                reject = true;
            }
        }
    }

    if (error && reject) {
        return refundStatus.REJECT_AND_ERROR;
    } else if (error) {
        return refundStatus.ERROR;
    } else if (reject) {
        return refundStatus.REJECT;
    // eslint-disable-next-line no-else-return
    } else {
        return refundStatus.SUCCESS;
    }
}

module.exports = {
    getPSTtime: getPSTtime,
    getProductLoggerModel: getProductLoggerModel,
    getContractLoggerModel: getContractLoggerModel,
    refundStatus: refundStatus,
    getRefundStatus: getRefundStatus
};
