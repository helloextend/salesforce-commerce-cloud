/* eslint-disable no-useless-concat */
/* eslint-disable radix */
/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
/* eslint-disable one-var */
/* eslint-disable block-scoped-var */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
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
    var qs = request.httpParameters;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var pid,
        qty,
        lead;
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
            lead = currentBasket.productLineItems[i];
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

    Transaction.wrap(function () {
        lead.custom.isWarrantable = true;
    });

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
 * @returns {object}
 */
function responseStatus(status, message) {
    return {
        status: status,
        details: message
    };
}

/**
 *
 * @param {string} currentWarrantyLi - current warranty list
 * @param {Object} form - form
 */
function updateExtendWarranty(currentWarrantyLi, form) {
    var quantityInCart = currentWarrantyLi.getQuantity();

    Transaction.wrap(function () {
        currentWarrantyLi.setQuantityValue(quantityInCart + parseInt(form.quantity, 10));
    });
}

/**
* Adds Extend warranty product line items to cart
*
* @transactional
* @param {Object} cart The Cart model
* @param {Object} params The params object
* @param {Object} Product Product model
*/
function createExtendLineItem(cart, form, Product) {
    var currentBasket = cart.object;
    var quantity = form.quantity.doubleValue || form.Quantity.doubleValue;
    var warrantyLi;

    // Configure the Extend ProductLineItem
    var productModel = Product.get('EXTEND-' + form.extendTerm);
    var shipment = currentBasket.defaultShipment;
    var productToAdd = productModel.object;
    var productOptionModel = productModel.updateOptionSelection(form);

    Transaction.wrap(function () {
        warrantyLi = cart.createProductLineItem(productToAdd, productOptionModel, shipment);

        // Configure the Extend ProductLineItem
        warrantyLi.setProductName('Extend Protection Plan' + ' for ' + form.productName);
        warrantyLi.setLineItemText('Extend Product Protection: ' + parseInt(form.extendTerm / 12) + ' years for ' + form.productName.value);
        warrantyLi.setManufacturerSKU(form.extendPlanId);
        warrantyLi.setPriceValue(parseInt(form.extendPrice, 10) / 100);
        warrantyLi.setQuantityValue(parseInt(quantity, 10));
        warrantyLi.custom.isWarranty = true;
        if (form.leadToken) {
            warrantyLi.custom.leadExtendId = form.extendPlanId;
            warrantyLi.custom.leadQuantuty = +form.quantity;
            warrantyLi.custom.postPurchaseLeadToken = form.leadToken;
        }

        cart.calculate();
    });
}

/**
 * Refund extend warranty from order
 */
function refund() {
    var res = require('*/cartridge/scripts/util/Response');
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var ArrayList = require('dw/util/ArrayList');
    var logger = require('dw/system/Logger');
    var extend = require('~/cartridge/scripts/extend');
    var jobHelpers = require('~/cartridge/scripts/jobHelpers');
    var headerKey = request.httpHeaders.get('extendsecretkey');
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
    }

    data = JSON.parse(request.httpParameterMap.requestBodyAsString);


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
    var product = {};
    var contract = {};

    if (data.products) {
        for (var i = 0; i < data.products.length; i++) {
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

            var warrantiesArray = [];

            for (var j = 0; j < apiOrder.productLineItems.length; j++) {
                var currentProduct = apiOrder.productLineItems[j];
                for (var l = 0; l < pLi.length; l++) {
                    if (currentProduct.custom.parentLineItemUUID === pLi[l].custom.persistentUUID) {
                        extendLi = currentProduct;
                        warrantiesArray.push(extendLi);
                    }
                }
            }

            if (!warrantiesArray.length) {
                responseProduct(RESPONSE, reqProduct, products, product, 'product has no extend');
                continue;
            }

            var refundsCounter = null;

            for (var n = 0; n < reqProduct.qty; n++) {
                for (var m = 0; m < warrantiesArray.length; m++) {
                    var warranty = warrantiesArray[m];

                    var extendContractIds;
                    var statuses;

                    product.productID = reqProduct.productID;
                    product.contracts = contracts;

                    var extendRefundStatuses = JSON.parse(warranty.custom.extendRefundStatuses) || {};
                    statuses = Object.keys(extendRefundStatuses);

                    if (!warranty.custom.extendContractId.length || (!statuses && !statuses.length)) {
                        continue;
                    } else if (statuses.length) {
                        extendContractIds = statuses;
                    } else {
                        extendContractIds = warranty.custom.extendContractId;
                    }

                    for (var p = 0; p < extendContractIds.length; p++) {
                        var extendContractId = extendContractIds[n];

                        if (refundsCounter >= reqProduct.qty) {
                            break;
                        }

                        refundsCounter++;

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

                        if (responseFromExtend.error) {
                            extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                            contract[extendContractId] = responseStatus(refundStatus.ERROR, 'service call error');
                            continue;
                        }

                        if (responseFromExtend.refundAmount.amount === 0) {
                            extendRefundStatuses[extendContractId] = refundStatus.REJECT;
                            contract[extendContractId] = responseStatus(refundStatus.REJECT, 'extend contract has not been refunded due to the refund amount');
                        } else if (responseFromExtend.refundAmount.amount > 0) {
                            paramObj.commit = true;
                            responseFromExtend = extend.createRefund(paramObj);

                            if (responseFromExtend.id) {
                                extendRefundStatuses[extendContractId] = refundStatus.SUCCESS;
                                contract[extendContractId] = responseStatus(refundStatus.SUCCESS, 'extend contract has been successfully refunded');
                            } else {
                                extendRefundStatuses[extendContractId] = refundStatus.ERROR;
                                contract[extendContractId] = responseStatus(refundStatus.ERROR, 'service call error');
                            }
                        }
                    }

                    Transaction.wrap(function () {
                        warranty.custom.extendRefundStatuses = JSON.stringify(extendRefundStatuses);
                    });
                }
            }
            contracts.push(contract);
            product.contracts = contracts;
            products.push(product);
            RESPONSE.products = products;
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

    res.renderJSON({
        message: RESPONSE
    });

    return;
}

/**
 * Post-purchase lead offer
 */
function postPurchase() {
    var res = require('*/cartridge/scripts/util/Response');
    var BasketMgr = require('dw/order/BasketMgr');
    var cart = app.getModel('Cart').goc();
    var ProductModel = app.getModel('Product');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    if (!currentBasket) {
        return;
    }

    var form = request.httpParameterMap;
    if (form.extendPlanId && form.extendPrice && form.extendTerm) {
        // Determine whether warranty line item already exists for this product line item
        var currentWarrantyLi = null;
        var warrantyLis = currentBasket.getProductLineItems('EXTEND-' + form.extendTerm);
        for (var i = 0; i < warrantyLis.length; i++) {
            if (warrantyLis[i].custom.leadExtendId === form.extendPlanId.value) {
                currentWarrantyLi = warrantyLis[i];
                break;
            }
        }

        if (currentWarrantyLi) {
            updateExtendWarranty(currentWarrantyLi, form);
        } else {
            createExtendLineItem(cart, form, ProductModel);
        }

        var updatedBasket = app.getModel('Cart').get();

        res.renderJSON({
            updatedBasket: updatedBasket,
            renderExtendButton: false
        });
    }
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

/** Post-purchase lead offer
 * @see {@link module:controllers/Extend~postPurchase} */
exports.PostPurchase = guard.ensure(['post', 'https'], postPurchase);
