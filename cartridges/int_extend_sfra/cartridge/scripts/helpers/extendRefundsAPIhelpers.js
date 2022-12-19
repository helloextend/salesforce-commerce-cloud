/* eslint-disable no-param-reassign */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-loop-func */
/* eslint-disable no-redeclare */
/* eslint-disable no-continue */
/* eslint-disable block-scoped-var */
'use strict';

var Transaction = require('dw/system/Transaction');
var extend = require('~/cartridge/scripts/extend');

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
 * Fill API responses
 * @param {Object} apiResponse - main object with response
 * @param {String} reqProduct - product id
 * @param {Array} products - array with products
 * @param {Object} product - object which contain product and quantity
 * @param {String} message - message with details info
 */
function fillApiResponse(apiResponse, reqProduct, products, product, message) {
    if (products && product && reqProduct) {
        product.productID = reqProduct.productID;
        product.details = message;
        products.push(product);
        apiResponse.products = products;
    }
}

/**
 * Fill API responses
 * @param {Object} apiResponse - main object with response
 * @param {String} reqProduct - product id
 * @param {Array} contracts - array with contracts
 * @param {Object} contract - object which contain contract info
 * @param {String} message - message with details info
 */
function fillApiResponseContract(apiResponse, contracts, contract, reqContract, message) {
    if (contracts && contract && reqContract) {
        contract[reqContract] = message;
        contracts.push(contract);
        apiResponse.contracts = contracts;
    }
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

/**
 * Returns Extensions (warranties and extend shipping protection)
 * @param {Object} apiOrder - current order
 * @param {Object} productLi - requested Product Line Item
 * @returns extendLineItems (warranties and extend shipping protection)
 */
function getExtendProductLineItem(apiOrder, productLi) {
    var extendLineItems = {};

    var warrantiesArray = [];
    var extendLi = null;

    for (var j = 0; j < apiOrder.productLineItems.length; j++) {
        var currentProduct = apiOrder.productLineItems[j];
        if (currentProduct.custom.parentLineItemUUID === productLi.custom.persistentUUID) {
            extendLi = currentProduct;
            warrantiesArray.push(extendLi);
        }
    }

    extendLineItems.warrantiesArray = warrantiesArray || null;

    return extendLineItems;
}

/**
 * Process Warranties Array and field the refund statuses
 * @param {Object} product - object to fill responses (product info)
 * @param {Array} warrantiesArray - array of warranties
 * @param {Object} reqProduct - requested product
 * @param {Object} refundStatus - refund statuses
 * @param {Number} refundsCounter - refundsCounter
 * @returns product
 */
function processWarrantiesArray(product, warrantiesArray, reqProduct, refundStatus, refundsCounter) {
    var contracts = [];
    for (var i = 0; i < warrantiesArray.length; i++) {
        var contracts = [];
        var warranty = warrantiesArray[i];

        var extendContractIds;
        var statuses;

        var extendRefundStatuses = JSON.parse(warranty.custom.extendRefundStatuses) || {};
        statuses = Object.keys(extendRefundStatuses);

        if (!warranty.custom.extendContractId.length || (!statuses && !statuses.length)) {
            break;
        } else if (statuses.length) {
            extendContractIds = statuses;
        } else {
            extendContractIds = warranty.custom.extendContractId;
        }

        for (var k = 0; k < reqProduct.qty; k++) {
            // object for requested contract
            var contract = {};

            var extendContractId = extendContractIds[k];

            if (refundsCounter >= reqProduct.qty) {
                break;
            }

            refundsCounter++;

            var isContractRefunded = extendRefundStatuses &&
                        (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                        extendRefundStatuses[extendContractId] === refundStatus.REJECT);

            if (isContractRefunded) {
                contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'The Extend contract has been already refunded');
                contracts.push(contract);
                continue;
            }

            var paramObj = {
                extendContractId: extendContractId,
                commit: false
            };

            var refundApiResponse = extend.createRefund(paramObj);

            if (refundApiResponse.error) {
                extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                contract[extendContractId] = responseStatus(refundStatus.ERROR, 'Service call error');
                contracts.push(contract);
                continue;
            }

            if (refundApiResponse.refundAmount.amount === 0) {
                extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                contract[extendContractId] = responseStatus(refundStatus.REJECT, 'Extend contract has not been refunded due to the refund amount');
            } else if (refundApiResponse.refundAmount.amount > 0) {
                paramObj.commit = true;
                refundApiResponse = extend.createRefund(paramObj);

                if (refundApiResponse.id) {
                    extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                    contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'Extend contract has been successfully refunded');
                } else {
                    extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                    contract[extendContractId] = responseStatus(refundStatus.ERROR, 'Service call error');
                }
            }

            contracts.push(contract);

            Transaction.wrap(function () {
                warranty.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
            });
        }
        product.contracts = contracts;
    }

    return product;
}

/**
 * Process Contracts and field the refund statuses
 * @param {Object} contract - object to fill responses (contract info)
 * @param {Object} extendLi - extend line item
 * @param {String} reqContract - requested contract
 * @param {Object} refundStatus - refund statuses
 * @returns apiResponse
 */
function processContracts(contract, extendLi, reqContract, refundStatus) {
    var extendContractIds;
    var statuses;

    var extendRefundStatuses = JSON.parse(extendLi.custom.extendRefundStatuses) || {};
    statuses = Object.keys(extendRefundStatuses) || [];

    var extendContractId;

    if (statuses.length) {
        extendContractIds = statuses;
        for (var i = 0; i < extendContractIds.length; i++) {
            if (reqContract !== extendContractIds[i]) {
                extendContractId = reqContract;
            }
        }
    } else {
        extendContractIds = extendLi.custom.extendContractId;
    }

    for (var k = 0; k < extendContractIds.length; k++) {
        if (reqContract === extendContractIds[k]) {
            extendContractId = reqContract;
        }
    }

    var isContractRefunded = extendRefundStatuses &&
                            (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                            extendRefundStatuses[extendContractId] === refundStatus.REJECT);

    if (isContractRefunded) {
        contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'The Extend contract has been already refunded');
        return contract;
    }

    var paramObj = {
        extendContractId: extendContractId,
        commit: false
    };

    var refundApiResponse = extend.createRefund(paramObj);

    if (refundApiResponse.error) {
        extendRefundStatuses[extendContractId] = refundStatus.ERROR;
        var errorMessage = JSON.parse(refundApiResponse.errorMessage).message;
        contract[extendContractId] = responseStatus(refundStatus.ERROR, errorMessage);
        return contract;
    }

    if (refundApiResponse.refundAmount.amount === 0) {
        extendRefundStatuses[extendContractId] = refundStatus.REJECT;
        contract[extendContractId] = responseStatus(refundStatus.REJECT, 'Extend contract has not been refunded due to the refund amount');
    } else if (refundApiResponse.refundAmount.amount > 0) {
        paramObj.commit = true;
        refundApiResponse = extend.createRefund(paramObj);

        if (refundApiResponse.id) {
            extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
            contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'Extend contract has been successfully refunded');
        } else {
            extendRefundStatuses[extendContractId] = refundStatus.ERROR;
            contract[extendContractId] = responseStatus(refundStatus.ERROR, 'Service call error');
        }
    }

    Transaction.wrap(function () {
        extendLi.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
    });

    return contract;
}


/**
 * Check requested contract availibility
 * @param {String} reqContract - requested contract
 * @param {Object} apiOrder - current order
 * @returns {boolean} contract availibility
 */
function checkContractAvailibility(reqContract, apiOrder) {
    var productLineItems = apiOrder.getProductLineItems();
    var defineExtendLI = {};

    for (var i = 0; i < productLineItems.length; i++) {
        var pLi = productLineItems[i];
        for (var k = 0; k < pLi.custom.extendContractId.length; k++) {
            if (reqContract === pLi.custom.extendContractId[k]) {
                defineExtendLI.extendLi = pLi;
                defineExtendLI.isReqContractFounded = true;

                return defineExtendLI;
            }
        }
    }

    defineExtendLI.extendLi = null;
    defineExtendLI.isReqContractFounded = false;

    return defineExtendLI;
}

module.exports = {
    isJsonValid: isJsonValid,
    fillApiResponse: fillApiResponse,
    fillApiResponseContract: fillApiResponseContract,
    getExtendProductLineItem: getExtendProductLineItem,
    processWarrantiesArray: processWarrantiesArray,
    checkContractAvailibility: checkContractAvailibility,
    processContracts: processContracts
};

