/* eslint-disable no-useless-concat */
/* eslint-disable no-param-reassign */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-unused-vars */
/* eslint-disable no-loop-func */
/* eslint-disable no-redeclare */
/* eslint-disable no-continue */
/* eslint-disable block-scoped-var */
'use strict';

var server = require('server');

server.post('Refund', server.middleware.https, function (req, res, next) {
    /* API Includes */
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var ArrayList = require('dw/util/ArrayList');
    var logger = require('dw/system/Logger');
    var collections = require('*/cartridge/scripts/util/collections');

    /* EXTEND HELPERS*/
    var extend = require('~/cartridge/scripts/extend');
    var jobHelpers = require('~/cartridge/scripts/jobHelpers');
    var extendRefundsAPIHelpers = require('*/cartridge/scripts/helpers/extendRefundsAPIhelpers');


    var headerKey = req.httpHeaders.get('extendsecretkey');
    var extendSecretKey = Site.getCurrent().getCustomPreferenceValue('extendSecretKey');

    if (headerKey !== extendSecretKey) {
        res.setStatusCode(400);
        res.json({
            error: true,
            message: 'The token mismatch'
        });
        return next();
    }

    var data = req.body;

    if (!extendRefundsAPIHelpers.isJsonValid(data)) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: 'Invalid JSON'
        });
        return next();
    }
    data = JSON.parse(req.body);


    var apiOrder = OrderMgr.getOrder(data.orderID);
    if (!apiOrder) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: 'No such order exists'
        });
        return next();
    }

    var apiOrderToken = apiOrder.getOrderToken();

    // Resolves an order using the orderNumber and orderToken.
    apiOrder = OrderMgr.getOrder(data.orderID, apiOrderToken);

    if (!data.products && !data.contracts) {
        res.setStatusCode(500);
        res.json({
            error: true,
            errorMessage: 'No product or contract array are provided'
        });
        return next();
    }

    var apiResponse = {};
    var products = [];

    var refundStatus = jobHelpers.refundStatus;

    if (data.products) {
        for (var i = 0; i < data.products.length; i++) {
            var reqProduct = data.products[i];

            // Object to fill responses (product info)
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

            if (!reqProduct.qty || reqProduct.qty === 0 || (reqProduct.qty > productLi.quantity.value)) {
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

    res.json({
        message: apiResponse
    });

    return next();
});

server.post('PostPurchase', function (req, res, next) {
    /* API Includes */
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var CartModel = require('*/cartridge/models/cart');
    var URLUtils = require('dw/web/URLUtils');

    /* EXTEND HELPERS*/
    var extendHelpers = require('~/cartridge/scripts/helpers/extendHelpers');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var extendWarrantyLineItemHelpers = require('*/cartridge/scripts/helpers/extendWarrantyLineItemHelpers');
    var normalizeCartQuantities = require('*/cartridge/scripts/normalizationCartHook');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    if (!currentBasket) {
        return next();
    }

    var form = req.form;

    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    if (form.extendPlanId && form.extendPrice && form.extendTerm) {
        var product = ProductMgr.getProduct('EXTEND-' + form.extendTerm);

        // Determine whether warranty line item already exists for this product line item
        var currentWarrantyLi;
        var warrantyLis = currentBasket.getProductLineItems('EXTEND-' + form.extendTerm);
        for (var i = 0; i < warrantyLis.length; i++) {
            if (warrantyLis[i].custom.leadExtendId === form.extendPlanId) {
                currentWarrantyLi = warrantyLis[i];
                break;
            }
        }

        if (currentWarrantyLi) {
            extendWarrantyLineItemHelpers.updateExtendWarranty(currentWarrantyLi, form);
        } else {
            extendWarrantyLineItemHelpers.addExtendWarrantyToCart(currentBasket, product, null, form);
        }

        var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);

        var actionUrl = {
            continueUrl: URLUtils.url('Cart-Show').toString()
        };

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new CartModel(currentBasket);

        res.json({
            quantityTotal: quantityTotal,
            actionUrl: actionUrl,
            message: result.message,
            basket: basketModel,
            error: result.error,
            minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal),
            renderExtendButton: false
        });
    }
    return next();
});

module.exports = server.exports();
