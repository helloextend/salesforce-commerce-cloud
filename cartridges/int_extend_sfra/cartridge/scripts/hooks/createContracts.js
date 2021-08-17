'use strict';

var Site = require('dw/system/Site').getCurrent();

/**
 * Inits service instance for specific Extend operation
 * @param {dw.object.CustomObject} contractCO - instance of ExtendContractsQueue object
 * @returns {dw.svc.LocalServiceRegistry} - initialized service instance
 */
function createContractObj(contractCO) {
    var customer = JSON.parse(contractCO.custom.customer);
    var product = JSON.parse(contractCO.custom.product);
    var plan = JSON.parse(contractCO.custom.plan);

    var requestObject = {
        transactionId: contractCO.custom.orderNo,
        transactionTotal: contractCO.custom.orderTotal,
        transactionDate: contractCO.getCreationDate().valueOf(),
        customer: customer,
        product: product,
        currency: contractCO.custom.currency,
        plan: plan
    };

    return JSON.stringify(requestObject);
}

function createPayload(params) {
    var apiVersion = Site.getCustomPreferenceValue('extendAPIVersion').value;
    var customer = JSON.parse(params.custom.customer);
    var shippingAddress = JSON.parse(params.custom.shippingAddress);
    var product = JSON.parse(params.custom.product);
    var plan = JSON.parse(params.custom.plan);
    var requestObject = {};

    requestObject.transactionId = params.custom.orderNo;

    if (apiVersion === 'Default') {
        requestObject.customer = customer;
        requestObject.transactionTotal = params.custom.orderTotal
    } else if (apiVersion === '2019-08-01') {
        requestObject.transactionTotal = {
            currencyCode: params.custom.currency,
            amount: params.custom.orderTotal
        }
        requestObject.customer = customer;
        requestObject.customer.billingAddress = customer.address;
        requestObject.customer.shippingAddress = shippingAddress;
        delete requestObject.customer.address;
    }

    return requestObject;
}

module.exports = {
    createPayload: createPayload
}