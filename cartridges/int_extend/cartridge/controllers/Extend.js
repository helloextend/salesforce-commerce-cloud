'use strict';

/**
 * Controller that adds extra functionality.
 * @module controllers/Extend
 */

/* API Includes */
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');

/* EXTEND */
var extendHelpers = require('*/cartridge/scripts/extendHelpers');

/**
 * Check productId against the Extend API Offer endpoint
 * This is used in cart to asynchronously enable up-sell modal
 */
function isEligibleForWarranty() {
    var BasketMgr = require('dw/order/BasketMgr');
    var extend = require('*/cartridge/scripts/extend');

    var qs = request.httpParameters;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var pid,
        qty;
    var response = require('*/cartridge/scripts/util/Response');

    // Query string parameter wasn't provided
    if (!qs.uuid[0]) {
        response.renderJSON({
            isEligible: false
        });
        return;
    }

    // Check if there's already an Extend product attached to this line item or current product is Extend Product
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].custom.parentLineItemUUID === qs.uuid[0] || (!empty(currentBasket.productLineItems[i].custom.parentLineItemUUID) && currentBasket.productLineItems[i].getUUID() === qs.uuid[0])) {
        	response.renderJSON({
            isEligible: false
        });
            return;
        }
    }

    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].UUID === qs.uuid[0]) {
            pid = currentBasket.productLineItems[i].productID;
            qty = currentBasket.productLineItems[i].quantityValue;
            break;
        }
    }

    // No line item with the provided UUID was found in current basket
    if (!pid) {
        response.renderJSON({
            isEligible: false
        });
        return;
    }

    response.renderJSON({
    	isEligible: true,
        pid: pid,
        qty: qty
    });
}


/**
 * Handle Extend products when adding to cart from up-sell modal
 */
function addExtendProduct() {
    var response = require('*/cartridge/scripts/util/Response');
    var ProductModel = app.getModel('Product');
    var cart = app.getModel('Cart').goc();
    var currentBasket = cart.object;
    var params = request.httpParameterMap;

    if (!currentBasket) {
        response.setStatusCode(500);
        response.renderJSON({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return;
    }

    extendHelpers.createOrUpdateExtendLineItem(cart, params, ProductModel);

    Transaction.wrap(function () {
        cart.calculate();
    });

    var updatedBasket = app.getModel('Cart').get();

    response.renderJSON(updatedBasket);
    return;
}

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
        product.error_details = message;
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
 * @param {array} contracts - array with contracts
 * @param {Object} contract - object which contain contract
 * @param {string} contractId - contract id
 * @param {string} message - message with error details
 */
function productResponse(RESPONSE, reqProduct, products, product, contracts, contract, contractId, message, status) {
    product.productID = reqProduct.productID;
    products.push(product);
    contract[contractId] = status;
    contracts.push(contract);
    products.push(contracts);
    RESPONSE.products = products;
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
function handleProductResponse(RESPONSE, reqProduct, products, product, contracts, contract, contractId, message, status) {
    contract[contractId]
    contract[contractId] = message;
    contracts.push(contract);
    product.productID = reqProduct.productID;
    product.contracts = contracts;
    products.push(product);
    RESPONSE.products = products;
}

/**
 * Function to create response
 * @param {Object} RESPONSE - object with response
 * @param {string} reqProduct - product id
 * @param {array} products - array with products
 * @param {Object} product - object which contain product and quantity
 * @param {string} message - message with error details
 */
function refundedProduct(RESPONSE, reqProduct, products, product, message) {
    product.productID = reqProduct.productID;
    product["details"] = message;
    products.push(product);
    RESPONSE.products = products;
}

/**
 * Function to get status from server
 * @param {Object} RESPONSE - object with response
 * @param {array} contracts - array with contracts
 * @param {Object} contract - object which contain contract
 * @param {string} extendContractId - contract id from BM
 * @param {Object} refundStatus - object with statuses
 * @param {string} message- message with error details
 */
function responseStatus(RESPONSE, contracts, contract, reqContract, refundStatus, message) {
    contract[reqContract] = refundStatus;
    contract["details"] = message;
    contracts.push(contract)

    RESPONSE.contracts = contracts;
}

/**
 * Function to get status from server
 * @param {Object} RESPONSE - object with response
 * @param {array} contracts - array with contracts
 * @param {Object} contract - object which contain contract
 * @param {string} extendContractId - contract id from BM
 * @param {Object} refundStatus - object with statuses
 * @param {string} message- message with error details
 */
function responseStatusForProduct(RESPONSE, products, product, reqProduct, contracts, contract, contractId, refundStatus, message) {
    product.productID = reqProduct.productID
    contract[contractId] = refundStatus;
    contract["details"] = message;
    product.contracts = contract;
    products.push(product);

    RESPONSE.products = products;
}

/**
 * Refund extend warranty from order
 */
function refund() {
    var res = require('*/cartridge/scripts/util/Response');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var ArrayList = require('dw/util/ArrayList');
    var logger = require('dw/system/Logger');
    var extend = require('~/cartridge/scripts/extend');
    var jobHelpers = require('~/cartridge/scripts/jobHelpers');
​    var headerKey = request.httpHeaders.get('extendsecretkey');
    var SECRET_KEY = Site.getCurrent().getCustomPreferenceValue('extendSecretKey');

    if (headerKey !== SECRET_KEY) {
        response.setStatus(400);
        response.renderJSON({
            error: true,
            message: 'token mismatch'
        });
        return;
    }

    var refundStatus = jobHelpers.refundStatus;

    var data = request.httpParameterMap.requestBodyAsString;

    if (!isJsonValid(data)) {
        response.setStatus(500);
        res.renderJSON({
            error: true,
            errorMessage: 'invalid JSON'
        });
        return;
    } else {
        data = JSON.parse(request.httpParameterMap.requestBodyAsString);
    }

    var apiOrder = OrderMgr.getOrder(data.orderID);
    if (!apiOrder) {
        response.setStatus(500);
        res.renderJSON({
            error: true,
            errorMessage: 'no such order exists'
        });
        return;
    }

    if (!data.products && !data.contracts) {
        response.setStatus(500);
        res.renderJSON({
            error: true,
            errorMessage: 'no product or contract array are provided'
        });
        return;
    }

    var RESPONSE = {};
    var products = [];
    var contracts = [];

    if (data.products) {
        for (var i = 0; i < data.products.length; i += 1 ) {
            var reqProduct = data.products[i];
            var product = {};
            var contract = {};

            if (!reqProduct.productID) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'no product id provided');
                continue;
            }

            if (!reqProduct.qty || reqProduct.qty == 0) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'no product quantity');
                continue;
            }

            var pLi = apiOrder.getProductLineItems(reqProduct.productID);
            var extendLi; // product which have contracts

            if (!pLi.length) {
                errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'no product id provided');
                continue;
            }

            for (var q = 0; q < pLi.length; q += 1) {
                if (reqProduct.qty > pLi[q].quantity.value) {
                    errorInRequest(RESPONSE, reqProduct, products, product, [], {}, '', 'quantity mismatch');
                    continue;
                }
            }

            for (var p = 0; p < pLi.length; p += 1) {
                if (!pLi[p].custom.persistentUUID) {
                    refundedProduct(RESPONSE, reqProduct, products, product, 'product has no extend');
                    continue;
                }
            }

            for (var j = 0; j < apiOrder.productLineItems.length; j +=1 ) {
                var currentProduct = apiOrder.productLineItems[j];
                for (var l = 0; l < pLi.length; l += 1) {
                    if (currentProduct.custom.parentLineItemUUID === pLi[l].custom.persistentUUID) {
                        extendLi = currentProduct;
                    }
                }
            }

            if (!extendLi) {
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

            for (var k = 0; k < reqProduct.qty; k +=1 ) {
                var extendContractId = extendContractIds[k];

                var isContractRefunded = extendRefundStatuses &&
                                        (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                                        extendRefundStatuses[extendContractId] === refundStatus.REJECT);

                if (isContractRefunded) {
                    handleProductResponse(RESPONSE, reqProduct, products, product, contracts, contract, extendContractId, 'extend already refunded', '');
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
                    responseStatusForProduct(RESPONSE, products, product, reqProduct, contracts, contract, extendContractId, refundStatus.ERROR, 'service call error')
                    continue;
                }

                if (responseFromExtend.refundAmount.amount === 0) {
                    extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                    responseStatusForProduct(RESPONSE, products, product, reqProduct, contracts, contract, extendContractId, refundStatus.REJECT, 'extend contract has not been refunded due to the refund amount');
                    continue;
                } else if (responseFromExtend.refundAmount.amount > 0) {
                    paramObj.commit = true;
                    responseFromExtend = extend.createRefund(paramObj);

                    if (responseFromExtend.id) {
                        extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                        responseStatusForProduct(RESPONSE, products, product, reqProduct, contracts, contract, extendContractId, refundStatus.SUCCESS, 'extend contract has been successfully refunded');
                    } else {
                        extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                        responseStatusForProduct(RESPONSE, products, product, reqProduct, contracts, contract, extendContractId, refundStatus.ERROR, 'service call error');
                        continue;
                    }
                }
            }
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
                for (var k = 0 ; k < currentContract.custom.extendContractId.length; k += 1) {
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

           for (var q = 0; q < extendContractIds.length; q +=1 ) {
               if (reqContract === extendContractIds[q]) {
                   extendContractId = reqContract;
               }
           }

            var isContractRefunded = extendRefundStatuses &&
                                    (extendRefundStatuses[extendContractId] === refundStatus.SUCCESS ||
                                    extendRefundStatuses[extendContractId] === refundStatus.REJECT);

            if (isContractRefunded) {
                errorInRequest(RESPONSE, '', [], {}, contracts, contract, reqContract, 'contract has been already refunded');
                continue;
            }

            var paramObj = {
                extendContractId: extendContractId,
                commit: false
            };

            var responseFromExtend = extend.createRefund(paramObj);

            if (responseFromExtend.error) {
                extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                responseStatus(RESPONSE, contracts, contract, extendContractId, 'service call error')
                continue;
            }

            if (responseFromExtend.refundAmount.amount === 0 ) {
                extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                responseStatus(RESPONSE, contracts, contract, extendContractId, 'extend contract has not been refunded due to the refund amount');
                continue;
            } else if (responseFromExtend.refundAmount.amount > 0) {
                paramObj.commit = true;
                responseFromExtend = extend.createRefund(paramObj);

                if (responseFromExtend.id) {
                    extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                    responseStatus(RESPONSE, contracts, contract, extendContractId, refundStatus.SUCCESS, 'extend contract has been successfully refunded');
                } else {
                    extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                    responseStatus(RESPONSE, contracts, contract, extendContractId, 'service call error');
                    continue;
                }
            }
            Transaction.wrap(function () {
                extendLi.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
            });
        }
    }

    res.renderJSON({
        message: RESPONSE
    });

    return;
}


/*
* Module exports
*/

/*
* Exposed methods.
*/
/** Checks if a product is eligible for warranty.
 * @see {@link module:controllers/Extend~isEligibleForWarranty} */
exports.IsEligibleForWarranty = guard.ensure(['get', 'https'], isEligibleForWarranty);

/** Adds Exend warranty product to cart.
 * @see {@link module:controllers/Extend~addExtendProduct} */
exports.AddExtendProduct = guard.ensure(['post', 'https'], addExtendProduct);

/** Refund extend warranty from order.
 * @see {@link module:controllers/Extend~refund} */
 exports.Refund = guard.ensure(['post', 'https'], refund);