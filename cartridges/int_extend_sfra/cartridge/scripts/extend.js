/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var webService = require('~/cartridge/scripts/services/rest');

/**
 * Get contracts payload for default API version
 * @param {dw.object.CustomObject} paramObj - instance of ExtendContractsQueue object
 * @returns {Object} requestObject - payload object for request
 */
function getContractsDefaultPayload(paramObj) {
    var contractCO = paramObj.custom;
    var customer = JSON.parse(contractCO.customer);
    var product = JSON.parse(contractCO.product);
    var plan = JSON.parse(contractCO.plan);

    var requestObject = {
        transactionId: contractCO.orderNo,
        transactionTotal: contractCO.orderTotal,
        transactionDate: paramObj.getCreationDate().valueOf(),
        customer: customer,
        product: product,
        currency: contractCO.currency,
        plan: plan
    };

    return requestObject;
}

/**
 * Get contracts payload for specific API version
 * @param {dw.object.CustomObject} paramObj - instance of ExtendContractsQueue object
 * @returns {Object} requestObject - payload object for request
 */
function getContractsPayload(paramObj) {
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var apiVersion = Site.getCustomPreferenceValue('extendAPIVersion').value;
    var defaultPayload = getContractsDefaultPayload(paramObj);

    if (apiVersion === 'default') {
        return defaultPayload;
    }

    var contractCO = paramObj.custom;
    var customer = JSON.parse(contractCO.customer);
    var shippingAddress = JSON.parse(contractCO.shippingAddress);
    var product = JSON.parse(contractCO.product);
    var plan = JSON.parse(contractCO.plan);
    var requestObject = defaultPayload;

    requestObject.transactionTotal = {
        currencyCode: contractCO.currency,
        amount: contractCO.orderTotal
    };

    requestObject.customer.billingAddress = customer.address;
    requestObject.customer.shippingAddress = shippingAddress;
    delete requestObject.customer.address;

    requestObject.product.purchasePrice = {
        currencyCode: contractCO.currency,
        amount: product.purchasePrice
    };

    requestObject.plan.purchasePrice = {
        currencyCode: contractCO.currency,
        amount: plan.purchasePrice
    };

    if (apiVersion === '2021-04-01') {
        requestObject.isTest = true;
    }

    return requestObject;
}

/**
 * Get products payload for specific API version
 * @param {ArrayList<Product>} productBatch - array of products
 * @returns {Array} requestObject - payload object for request
 */
function getProductsPayload(productBatch) {
    var apiVersion = Site.getCustomPreferenceValue('extendAPIVersion').value;
    var requestObject = [];

    for (var i = 0; i < productBatch.length; i++) {
        var product = productBatch[i];
        var EXTEND_IMAGE_VIEW_TYPE = Site.getCustomPreferenceValue('extendImageViewType');

        try {
            var category = '';
            if (product.isVariant()) {
                category = !empty(product.getMasterProduct().getPrimaryCategory()) ? product.getMasterProduct().getPrimaryCategory().getID() : '';
            } else {
                category = !empty(product.getPrimaryCategory()) ? product.getPrimaryCategory().getID() : '';
            }

            var price = product.priceModel.price.available && product.priceModel.price.value > 0 ? Math.round(product.priceModel.price.value * 100) : 0;

            if (apiVersion !== 'default') {
                price = {
                    currencyCode: product.priceModel.price.getCurrencyCode(),
                    amount: price
                };
            }

            var productObj = {};
            productObj.brand = product.getBrand();
            productObj.category = category;
            productObj.description = !empty(product.getShortDescription()) ? product.getShortDescription().getMarkup() : '';
            productObj.imageUrl = product.getImage(EXTEND_IMAGE_VIEW_TYPE, 0) ? product.getImage(EXTEND_IMAGE_VIEW_TYPE, 0).getAbsURL().toString() : '';
            productObj.mfrWarranty = {
                parts: product.custom.mfrWarrantyParts,
                labor: product.custom.mfrWarrantyLabor
            };
            productObj.price = price;
            productObj.title = product.getName();
            productObj.referenceId = product.getID();
            productObj.parentReferenceId = product.isVariant() ? product.getMasterProduct().getID() : '';
            productObj.identifiers = {
                sku: product.getID(),
                upc: product.getUPC()
            };
            requestObject.push(productObj);
        } catch (error) {
            logger.error('Request object could not be created. {0}', error);
        }
    }

    return requestObject;
}

/**
<<<<<<< HEAD
=======
 * Converts Money object to integer cents value
 * @param {Money} value : API Money object
 * @return {Integer} cents value
 */
function moneyToCents(value) {
    return value.decimalValue * 100;
}

/**
 * Get SFCC product JSON object
 * @param {Order} order : API Order object
 * @param {string} UUID : UUID for the associated parent productLineItem
 * @return {string} stringified object
 */
function getSFCCProduct(order, UUID) {
    var obj = {};

    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];
        if (pLi.custom.persistentUUID === UUID) {
            var dividedPurchasePrice = pLi.adjustedNetPrice.divide(pLi.quantityValue);
            var dividedListPrice = pLi.price.divide(pLi.quantityValue);
            obj = {
                id: pLi.productID,
                purchasePrice: moneyToCents(dividedPurchasePrice),
                listPrice: moneyToCents(dividedListPrice),
                name: pLi.productName
            };
            break;
        }
    }

    return obj;
}

/**
 * Get Extend plan JSON object
 * @param {ProductLineItem} pLi : API ProductLineItem object
 * @return {string} stringified object
 */
function getExtendPlan(pLi, order) {
    var obj = {
        purchasePrice: Math.ceil(moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue)))
    };
    for (var i = 0; i < order.productLineItems.length; i++) {
        var productLi = order.productLineItems[i];
        if (productLi.custom.persistentUUID) {
            // obj.planToken = createEnhancedOffer(productLi);
            obj.id = createEnhancedOffer(productLi);
            break;
        }
    }

    return obj;
}

/**
 * Make call on orders endpoint
 * @param {dw.order.Order} order : API order
 * @return {Array<Object>} array of products objects
 */
function getLineItems(order) {
    var lineItems = [];
    for (var i = 0; i < order.productLineItems.length; i++) {
        var pLi = order.productLineItems[i];

        if (pLi.custom.parentLineItemUUID) {
            for (var j = 1; j <= pLi.getQuantityValue(); j++) {
                var pliObj = {};
                pliObj.status = 'fulfilled';
                pliObj.product = getSFCCProduct(order, pLi.custom.parentLineItemUUID);
                pliObj.plan = getExtendPlan(pLi, order);
                lineItems.push(pliObj);
            }
        }
    }
    return lineItems;
}

/**
 * Get Orders Create endpoint Payload
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - request object
 */
function getOrdersPayload(paramObj) {
    var order = paramObj.order;
    var customer = JSON.parse(paramObj.customer);
    var defaultShipment = order.getDefaultShipment();
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var requestObject = {};

    // requestObject.sellerId = STORE_ID;
    requestObject.storeId = STORE_ID;

    // What is the sellerName?
    // requestObject.sellerName = 'SFCC';
    requestObject.storeName = 'SFCC';

    requestObject.currency = order.getCurrencyCode();
    requestObject.customer = {};

    requestObject.customer.billingAddress = customer.address;
    requestObject.customer.email = customer.email;
    requestObject.customer.name = customer.name;
    requestObject.customer.phone = customer.phone;

    var address = defaultShipment.getShippingAddress();

    var shippingAddress = {
        address1: address.getAddress1(),
        address2: address.getAddress2(),
        city: address.getCity(),
        countryCode: address.getCountryCode().toString(),
        postalCode: address.getPostalCode(),
        provinceCode: address.getStateCode()
    };

    requestObject.isTest = true;

    requestObject.customer.shippingAddress = shippingAddress;

    requestObject.total = moneyToCents(order.getTotalGrossPrice());
    requestObject.transactionId = order.orderNo;
    requestObject.lineItems = getLineItems(order);
    return requestObject;
}

/**
 * Get Enhanced Offers endpoind Payload
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - request object
 */
function getEnhancedOffers(pLi) {
    var STORE_ID = Site.getCustomPreferenceValue('extendStoreID');
    var masterProduct = null;
    var category = null;
    var requestObject = {};

    requestObject.storeId = STORE_ID;
    requestObject.productId = pLi.productID;
    requestObject.product = {};

    var product = ProductMgr.getProduct(pLi.productID);
    if (product.isVariant()) {
        masterProduct = product.getMasterProduct();
        category = masterProduct.getPrimaryCategory();
    } else {
        category = product.getPrimaryCategory();
    }

    requestObject.product.title = pLi.productName;
    requestObject.product.category = category.displayName;
    requestObject.product.price = {};

    requestObject.product.price.currencyCode = pLi.adjustedNetPrice.getCurrencyCode();
    requestObject.product.price.amount = Math.ceil(moneyToCents(pLi.adjustedNetPrice.divide(pLi.quantityValue)));

    return requestObject;
}

/**
>>>>>>> parent of 029111e (EX-121: ADD: orders api for SG and SFRA)
 * Get products payload and make call on products endpoint
 * @param {Array<Product>} productBatch - array of products
 * @returns {Object} - response object
 */
function exportProducts(productBatch) {
    var requestObject = getProductsPayload(productBatch);
    var endpointName = 'products';
    var response = webService.makeServiceCall(endpointName, requestObject);
    return response;
}

/**
 * Get contracts payload and make call on contracts endpoint
 * @param {dw.object.CustomObject} paramObj - instance of ExtendContractsQueue object
 * @returns {Object} - response object
 */
function createContracts(paramObj) {
    var requestObject = getContractsPayload(paramObj);
    var endpointName = 'contracts';
    var response = webService.makeServiceCall(endpointName, requestObject);
    return response;
}

/**
 * Make call on refund contract endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createRefund(paramObj) {
    var endpointName = 'refund';
    var response = webService.makeServiceCall(endpointName, paramObj);
    return response;
}

/**
 * Make call on offer endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function getOffer(paramObj) {
    var endpointName = 'offer';
    var response = webService.makeServiceCall(endpointName, paramObj);
    return response;
}

<<<<<<< HEAD
=======
/**
 * Make call on orders endpoint
 * @param {Object} paramObj - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createOrders(paramObj) {
    var requestObject = getOrdersPayload(paramObj);
    var endpointName = 'orders';
    var apiMethod = 'orders';
    var response = webService.makeServiceCall(endpointName, requestObject, apiMethod);
    return response;
}

/**
 * Make call on enhanced offer endpoint
 * @param {dw.order.ProductLineItem} pli - object with id of contract and commit type
 * @returns {Object} - response object
 */
function createEnhancedOffer(pLi) {
    var requestObject = getEnhancedOffers(pLi);
    var endpointName = 'enhancedOffer';
    var apiMethod = 'orders';
    var response = webService.makeServiceCall(endpointName, requestObject, apiMethod);
    return response.offerId;
}

>>>>>>> parent of 029111e (EX-121: ADD: orders api for SG and SFRA)
module.exports = {
    exportProducts: exportProducts,
    createContracts: createContracts,
    createRefund: createRefund,
<<<<<<< HEAD
    getOffer: getOffer
=======
    getOffer: getOffer,
    createOrders: createOrders,
    createEnhancedOffer: createEnhancedOffer
>>>>>>> parent of 029111e (EX-121: ADD: orders api for SG and SFRA)
};
