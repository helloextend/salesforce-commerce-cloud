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
        lead,
        category,
        price;
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

    price = currentBasket.productLineItems[i].price.value / qty;
    const productData = currentBasket.productLineItems[i].getProduct();
    category = productData.variant
        ? productData.masterProduct.primaryCategory.getID()
        : productData.primaryCategory.getID();

    response.renderJSON({
        isEligible: true,
        pid: pid,
        qty: qty,
        category: category,
        price: price
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

    var normalizeCartQuantities = require('*/cartridge/scripts/normalizationCartHook');

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
        // Normalize cart quatities for extend warranty items
        normalizeCartQuantities(currentBasket);

        cart.calculate();
    });

    var updatedBasket = app.getModel('Cart').get();

    response.renderJSON(updatedBasket);
    return;
}

/**
 * Refund extend warranty from order
 */
function refund() {
    /* API Includes */
    var res = require('*/cartridge/scripts/util/Response');
    var Site = require('dw/system/Site');
    var OrderMgr = require('dw/order/OrderMgr');
    var ArrayList = require('dw/util/ArrayList');
    var logger = require('dw/system/Logger');
    var collections = require('*/cartridge/scripts/util/collections');

    /* EXTEND HELPERS*/
    var extend = require('~/cartridge/scripts/extend');
    var jobHelpers = require('~/cartridge/scripts/jobHelpers');
    var extendRefundsAPIHelpers = require('*/cartridge/scripts/extendRefundsAPIhelpers');

    var headerKey = request.httpHeaders.get('extendsecretkey');
    var extendSecretKey = Site.getCurrent().getCustomPreferenceValue('extendSecretKey');

    if (headerKey !== extendSecretKey) {
        response.setStatus(400);
        response.renderJSON({
            error: true,
            message: 'The token mismatch'
        });
        return;
    }

    var data = request.httpParameterMap.requestBodyAsString;

    if (!extendRefundsAPIHelpers.isJsonValid(data)) {
        response.setStatus(500);
        res.renderJSON({
            error: true,
            errorMessage: 'Invalid JSON'
        });
        return;
    }

    data = JSON.parse(request.httpParameterMap.requestBodyAsString);

    var apiOrder = OrderMgr.getOrder(data.orderID);
    if (!apiOrder) {
        response.setStatus(500);
        res.renderJSON({
            error: true,
            errorMessage: 'No such order exists'
        });
        return;
    }

    var apiOrderToken = apiOrder.getOrderToken();

    // Resolves an order using the orderNumber and orderToken.
    apiOrder = OrderMgr.getOrder(data.orderID, apiOrderToken);

    if (!data.products && !data.contracts) {
        response.setStatus(500);
        res.renderJSON({
            error: true,
            errorMessage: 'No product or contract array are provided'
        });
        return;
    }

    var apiResponse = {};
    var products = [];

    var refundStatus = jobHelpers.refundStatus;

    if (data.products) {
        for (var i = 0; i < data.products.length; i++) {
            var reqProduct = data.products[i];

            // object for requested product
            var product = {};
            product.productID = reqProduct.productID;

            // Requested Product Line Item
            var productLi = null;

            var allLineItems = apiOrder.getProductLineItems(reqProduct.productID);
            collections.forEach(allLineItems, function (productLineItem) {
                if (productLineItem.getProductID() === reqProduct.productID) {
                    productLi = productLineItem;
                }
            });

            if (!reqProduct.productID || !productLi) {
                extendRefundsAPIHelpers.fillApiResponse(apiResponse, reqProduct, products, product, 'The product was not found for current order');
                productLi = null;
                continue;
            }

            if (!reqProduct.qty || reqProduct.qty === 0 || reqProduct.qty > productLi.quantity.value) {
                extendRefundsAPIHelpers.fillApiResponse(apiResponse, reqProduct, products, product, 'Product quantity mismatch');
                productLi = null;
                continue;
            }

            var extendProductLineItems = extendRefundsAPIHelpers.getExtendProductLineItem(apiOrder, productLi);

            productLi = null;

            // Array of warranties
            var warrantiesArray = extendProductLineItems.warrantiesArray;

            if (!warrantiesArray) {
                extendRefundsAPIHelpers.fillApiResponse(apiResponse, reqProduct, products, product, 'The requested product have no extensions');
                continue;
            } else {
                var refundsCounter = null;
                product = extendRefundsAPIHelpers.processWarrantiesArray(product, warrantiesArray, reqProduct, refundStatus, refundsCounter);
                if (!product.contracts) {
                    extendRefundsAPIHelpers.fillApiResponse(apiResponse, reqProduct, products, product, 'The warranties has not contractId');

                    warrantiesArray = null;
                    apiResponse.products = products;

                    continue;
                }
            }

            warrantiesArray = null;
            products.push(product);
            apiResponse.products = products;
        }
    }

    var contracts = [];

    if (data.contracts) {
        for (var i = 0; i < data.contracts.length; i++) {
            var reqContract = data.contracts[i];
            var contract = {};

            var checkContractAvailibility = extendRefundsAPIHelpers.checkContractAvailibility(reqContract, apiOrder);
            var extendLi;

            if (!checkContractAvailibility.isReqContractFounded) {
                extendRefundsAPIHelpers.fillApiResponseContract(apiResponse, contracts, contract, reqContract, 'The contract was not found for current order');
                continue;
            } else {
                extendLi = checkContractAvailibility.extendLi;
            }

            contract = extendRefundsAPIHelpers.processContracts(contract, extendLi, reqContract, refundStatus);

            contracts.push(contract);
            apiResponse.contracts = contracts;
        }
    }

    res.renderJSON({
        message: apiResponse
    });

    return;
}

/**
 * Post-purchase lead offer
 */
function postPurchase() {
    /* API Includes */
    var res = require('*/cartridge/scripts/util/Response');
    var BasketMgr = require('dw/order/BasketMgr');
    var cart = app.getModel('Cart').goc();
    var ProductModel = app.getModel('Product');

    /* EXTEND HELPERS*/
    var extendWarrantyLineItemHelpers = require('*/cartridge/scripts/extendWarrantyLineItemHelpers');

    var normalizeCartQuantities = require('*/cartridge/scripts/normalizationCartHook');

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
            extendWarrantyLineItemHelpers.updateExtendWarranty(currentWarrantyLi, form);
        } else {
            extendWarrantyLineItemHelpers.createExtendLineItem(cart, form, ProductModel);
        }

        Transaction.wrap(function () {
            // Normalize cart quatities for extend warranty items
            normalizeCartQuantities(currentBasket);
    
            cart.calculate();
        });

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
