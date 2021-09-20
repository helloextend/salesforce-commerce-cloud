/* eslint-disable no-param-reassign */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-loop-func */
/* eslint-disable no-redeclare */
/* eslint-disable no-continue */
/* eslint-disable block-scoped-var */
'use strict';

var server = require('server');

/**
 * Function to check whether json valid
 * @param {string} jsonString - json
 * @returns {boolean} - true whether valid, otherwise - false
 */
function isJsonValid(jsonString) {
    try {
        return (JSON.parse(jsonString) && !!jsonString);
    } catch (e) {
        return false;
    }
}

/**
 * Function to create response
 * @param {Object} RESPONSE - object with response
 * @param {string} reqProduct - product id
 * @param {array} products - array with products
 * @param {Object} product - object which contain product and quantity
 * @param {array} contracts - array with contracts
 * @param {Object} contract - object which contain contract
 * @param {string} contractId - contract id
 * @param {string} message - message with error details
 */
function errorInRequest(RESPONSE, reqProduct, products, product, contracts, contract, reqContract, message) {
    if (products && product && reqProduct) {
        product.productID = reqProduct.productID;
        product.details = message;
        products.push(product);
        product = {};
        RESPONSE.products = products;
    }

    if (contracts && contract && reqContract) {
        contract[reqContract] = message;
        contracts.push(contract);
        contract = {};
        RESPONSE.contracts = contracts;
    }
}

/**
 * Function to create response
 * @param {Object} RESPONSE - object with response
 * @param {string} reqProduct - product id
 * @param {array} products - array with products
 * @param {Object} product - object which contain product and quantity
 * @param {string} message - message with error details
 */
function responseProduct(RESPONSE, reqProduct, products, product, message) {
    product.productID = reqProduct.productID;
    product.details = message;
    products.push(product);
    RESPONSE.products = products;
}

/**
 * Function which return status
 * @param {string} status - status of request
 * @param {string} message - message to describe details
 * @returns {Object}
 */
function responseStatus(status, message) {
    return {
        status: status,
        details: message
    };
}

server.post('Refund', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var ArrayList = require('dw/util/ArrayList');
    var logger = require('dw/system/Logger');
    var extend = require('~/cartridge/scripts/extend');
    var jobHelpers = require('~/cartridge/scripts/jobHelpers');
    var headerKey = req.httpHeaders.get('extendsecretkey');
    var SECRET_KEY = Site.getCurrent().getCustomPreferenceValue('extendSecretKey');

    if (headerKey !== SECRET_KEY) {
        res.setStatusCode(400);
        res.json({
            error: true,
            message: 'token mismatch'
        });
        return next();
    }

    var refundStatus = jobHelpers.refundStatus;

    var data = req.body;

    if (!isJsonValid(data)) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: 'invalid JSON'
        });
        return next();
    }
    data = JSON.parse(req.body);


    var apiOrder = OrderMgr.getOrder(data.orderID);
    if (!apiOrder) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: 'no such order exists'
        });
        return next();
    }

    if (!data.products && !data.contracts) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: 'no product or contract array are provided'
        });
        return next();
    }

    var RESPONSE = {};
    var products = [];
    var contracts = [];
    var product = {};
    var contract = {};

    if (data.products) {
        for (var i = 0; i < data.products.length; i += 1) {
            var reqProduct = data.products[i];

            if (!reqProduct.productID) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'no product id provided');
                continue;
            }

            if (!reqProduct.qty || reqProduct.qty === 0) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'no product quantity');
                continue;
            }

            var pLi = apiOrder.getProductLineItems(reqProduct.productID);
            var extendLi; // product which have contracts

            if (!pLi.length) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'no product id provided');
                continue;
            }

            if (reqProduct.qty > pLi[0].quantity.value) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'quantity mismatch');
                continue;
            }

            for (var j = 0; j < apiOrder.productLineItems.length; j += 1) {
                var currentProduct = apiOrder.productLineItems[j];
                for (var l = 0; l < pLi.length; l += 1) {
                    if (currentProduct.custom.parentLineItemUUID === pLi[l].custom.persistentUUID) {
                        extendLi = currentProduct;
                    }
                }
            }

            if (!extendLi) {
                responseProduct(RESPONSE, reqProduct, products, product, 'product has no extend');
                continue;
            }

            var extendContractIds;
            var statuses;
            var extendRefundStatuses = JSON.parse(extendLi.custom.extendRefundStatuses) || {};
            statuses = Object.keys(extendRefundStatuses);

            if (!extendLi.custom.extendContractId.length || (!statuses && !statuses.length)) {
                continue;
            } else if (statuses.length) {
                extendContractIds = statuses;
            } else {
                extendContractIds = extendLi.custom.extendContractId;
            }

            product.productID = reqProduct.productID;
            product.contracts = contracts;

            for (var k = 0; k < reqProduct.qty; k += 1) {
                var extendContractId = extendContractIds[k];

                if (!extendContractId) {
                    for (var n = 0; n < extendLi.custom.extendContractId.length; n++) {
                        var currentApiContract = extendLi.custom.extendContractId[n];
                        var isExists = extendContractIds.indexOf(currentApiContract);
                        if (isExists === -1) {
                            extendContractId = currentApiContract;
                            break;
                        }
                    }
                    if (!extendContractId) {
                        contract[`number_${k}`] = responseStatus(refundStatus.ERROR, 'contract not found');
                    }
                }

                var isContractRefunded = extendRefundStatuses &&
                                        (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                                        extendRefundStatuses[extendContractId] === refundStatus.REJECT);

                if (isContractRefunded) {
                    contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'extend has been already refunded');
                    continue;
                }

                var paramObj = {
                    extendContractId: extendContractId,
                    commit: false
                };

                var responseFromExtend = extend.createRefund(paramObj);
                var extendStatus;

                if (responseFromExtend.error) {
                    extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                    contract[extendContractId] = responseStatus(refundStatus.ERROR, 'service call error');
                    continue;
                }

                if (responseFromExtend.refundAmount.amount === 0) {
                    extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                    contract[extendContractId] = responseStatus(refundStatus.REJECT, 'extend contract has not been refunded due to the refund amount');
                    continue;
                } else if (responseFromExtend.refundAmount.amount > 0) {
                    paramObj.commit = true;
                    responseFromExtend = extend.createRefund(paramObj);

                    if (responseFromExtend.id) {
                        extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                        contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'extend contract has been successfully refunded');
                    } else {
                        extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                        contract[extendContractId] = responseStatus(refundStatus.ERROR, 'service call error');
                        continue;
                    }
                }
            }

            contracts.push(contract);
            product.contracts = contracts;
            products.push(product);
            RESPONSE.products = products;

            Transaction.wrap(function () {
                extendLi.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
            });
        }
    }

    if (data.contracts) {
        for (var i = 0; i < data.contracts.length; i += 1) {
            var reqContract = data.contracts[i];
            var contract = {};

            var pLi = apiOrder.getProductLineItems();
            var extendLi;

            for (var j = 0; j < pLi.length; j += 1) {
                var currentContract = pLi[j];
                for (var k = 0; k < currentContract.custom.extendContractId.length; k += 1) {
                    if (reqContract === currentContract.custom.extendContractId[k]) {
                        extendLi = currentContract;
                    }
                }
            }

            if (!extendLi) {
                errorInRequest(RESPONSE, '', [], {}, contracts, contract, reqContract, 'contract not found');
                continue;
            }

            var extendContractIds;
            var statuses;

            var extendRefundStatuses = JSON.parse(extendLi.custom.extendRefundStatuses) || {};
            statuses = Object.keys(extendRefundStatuses) || [];

            var extendContractId;

            if (!extendLi.custom.extendContractId.length || (!statuses && !statuses.length)) {
                continue;
            } else if (statuses.length) {
                extendContractIds = statuses;
                for (var t = 0; t < extendContractIds.length; t += 1) {
                    if (reqContract !== extendContractIds[t]) {
                        extendContractId = reqContract;
                    }
                }
            } else {
                extendContractIds = extendLi.custom.extendContractId;
            }

            for (var q = 0; q < extendContractIds.length; q += 1) {
                if (reqContract === extendContractIds[q]) {
                    extendContractId = reqContract;
                }
            }

            var isContractRefunded = extendRefundStatuses &&
                                    (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                                    extendRefundStatuses[extendContractId] === refundStatus.REJECT);

            if (isContractRefunded) {
                contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'extend has been already refunded');
                contracts.push(contract);
                RESPONSE.contracts = contracts;
                continue;
            }

            var paramObj = {
                extendContractId: extendContractId,
                commit: false
            };

            var responseFromExtend = extend.createRefund(paramObj);

            if (responseFromExtend.error) {
                extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                contract[extendContractId] = responseStatus(refundStatus.ERROR, 'service call error');
                continue;
            }

            if (responseFromExtend.refundAmount.amount === 0) {
                extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                contract[extendContractId] = responseStatus(refundStatus.REJECT, 'extend contract has not been refunded due to the refund amount');
                continue;
            } else if (responseFromExtend.refundAmount.amount > 0) {
                paramObj.commit = true;
                responseFromExtend = extend.createRefund(paramObj);

                if (responseFromExtend.id) {
                    extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                    contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'extend contract has been successfully refunded');
                } else {
                    extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                    contract[extendContractId] = responseStatus(refundStatus.ERROR, 'service call error');
                    continue;
                }
            }

            contracts.push(contract);
            RESPONSE.contracts = contracts;

            Transaction.wrap(function () {
                extendLi.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
            });
        }
    }

    res.json({
        message: RESPONSE
    });

    return next();
});

module.exports = server.exports();
