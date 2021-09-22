/* eslint-disable no-undef */
/* eslint-disable camelcase */
'use strict';

/**
 * Returns current time
 * @returns {string} - current time
 */
function getPSTtime() {
    var currentTime = new Date();
    var PST_offset = 8;

    currentTime.setHours(currentTime.getHours() - PST_offset);

    return currentTime;
}

/**
 * Returns info about product
 * @param {Object} product - some product
 * @returns {Object} - product model
 */
function getProductLoggerModel(product) {
    var result = {};

    result.ID = product.ID;
    result.title = product.name;
    result.price = product.priceModel.getPrice().getValue();
    result.timestampPST = getPSTtime().getTime();

    return result;
}

/**
 * Returns model for contract
 * @param {Object} order - order
 * @returns {Object} - contract
 */
function getContractLoggerModel(order) {
    var result = {};
    var customerProfile = order.getCustomer().getProfile();

    result.orderNumber = order.getOrderNo();
    result.customerFirstName = !empty(customerProfile) ? customerProfile.getFirstName() : order.defaultShipment.shippingAddress.firstName;
    result.customerLastName = !empty(customerProfile) ? customerProfile.getLastName() : order.defaultShipment.shippingAddress.lastName;
    result.timestampPST = getPSTtime().getTime();

    return result;
}

module.exports = {
    getPSTtime: getPSTtime,
    getProductLoggerModel: getProductLoggerModel,
    getContractLoggerModel: getContractLoggerModel
};
