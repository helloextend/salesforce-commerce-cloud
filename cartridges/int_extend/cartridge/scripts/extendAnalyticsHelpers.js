/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable block-scoped-var */
/* eslint-disable no-undef */
/* eslint-disable one-var */
/* eslint-disable valid-jsdoc */
/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
'use strict';

/**
 * Get extend product from basket
 * @param {dw.order.Basket} currentBasket
 * @param {dw.order.ProductLineItem} persistentItem
 * @returns {dw.order.ProductLineItem} - extend product with parentLineItemUUID === persistentItem
 */
function getExtendProduct(productLineItems, persistentItem) {
    for (var i = 0; i < productLineItems.length; i++) {
        if (persistentItem.custom.persistentUUID === productLineItems[i].custom.parentLineItemUUID) {
            return productLineItems[i];
        }
    }
}

/**
 * Get extended product from basket
 * @param {dw.order.Basket} currentBasket
 * @param {dw.order.ProductLineItem} persistentItem
 * @returns {dw.order.ProductLineItem} - extended product with persistentItem === parentLineItemUUID
 */
function getExtendedProduct(productLineItems, parentLineItem) {
    for (var i = 0; i < productLineItems.length; i++) {
        if (parentLineItem.custom.parentLineItemUUID === productLineItems[i].custom.persistentUUID) {
            return productLineItems[i];
        }
    }
}

/**
 * Get data for trackOfferUpdated event
 * @param {dw.order.ProductLineItem} updatedProduct
 * @param {dw.order.ProductLineItem} updatedPlan
 * @param {Object} data
 * @returns {Object} - data for trackOfferUpdated event
 */
function getOfferUpdatedData(updatedProduct, updatedPlan, data) {
    data.productID = updatedProduct.productID;
    data.planId = updatedPlan.manufacturerSKU;
    data.warrantyQuantity = updatedPlan.quantityValue;
    data.productQuantity = updatedProduct.quantityValue;

    if (data.warrantyQuantity > data.productQuantity) {
        data.warrantyQuantity = data.productQuantity;
    }

    return data;
}

/**
 * Get data for trackProductUpdated event
 * @param {dw.order.ProductLineItem} updatedProduct
 * @param {Object} data
 * @returns {Object} - data for trackProductUpdated event
 */
function getProductUpdatedData(updatedProduct, data) {
    data.productID = updatedProduct.productID;
    data.productQuantity = updatedProduct.quantityValue;

    return data;
}

/**
 * Get data for trackProductRemovedFromCart event
 * @param {dw.order.ProductLineItem} removedProduct
 * @returns {Object} - data for trackProductRemovedFromCart event
 */
function getProductRemovedFromCartData(removedProduct) {
    var productRemovedFromCart = {
        newQuantity: 0,
        productID: removedProduct.productID,
        event: 'productRemovedFromCart'
    };

    return productRemovedFromCart;
}

/**
 * Get data for trackOfferRemovedFromCart event
 * @param {dw.order.ProductLineItem} removedProduct
 * @param {dw.order.ProductLineItem} removedPlan
 * @returns {Object} - data for trackOfferRemovedFromCart event
 */
function getOfferRemovedFromCartData(removedProduct, removedPlan) {
    var offerRemovedFromCart = {
        newQuantity: 0,
        productID: removedProduct.productID,
        planId: removedPlan.manufacturerSKU,
        event: 'offerRemovedFromCart'
    };

    return offerRemovedFromCart;
}

/**
 * Get data about products to update before cart update
 * @param {Array} items array of pli to update
 * @param {Object} cart the cart model
 * @returns {Array} - array of pli to update
 */
function getItemsData(items, cart) {
    var itemsData = [];
    for (var i = 0; i < items.length; i++) {
        var extendProduct,
            extendedProduct;
        var data = {};
        var current = items[i];
        var productLineItems = cart.object.shipments[current.shipment].productLineItems;
        var product = productLineItems[current.position];

        data.UUID = product.UUID;
        data.quantityValue = product.quantityValue;
        data.newQuantity = current.newQuantity;

        if (product.custom.persistentUUID) {
            extendProduct = getExtendProduct(productLineItems, product);
            if (extendProduct) {
                itemsData.push(getOfferUpdatedData(product, extendProduct, data));
            } else {
                itemsData.push(getProductUpdatedData(product, data));
            }
        } else if (product.custom.parentLineItemUUID) {
            extendedProduct = getExtendedProduct(productLineItems, product);
            itemsData.push(getOfferUpdatedData(extendedProduct, product, data));
        } else {
            itemsData.push(getProductUpdatedData(product, data));
        }
    }

    return itemsData;
}

/**
 * Get data about products to update before cart update
 * @param {Object} cart the cart model
 * @returns {Array} - data for extend analytics
 */
function getUpdateCartData(cart) {
    var params = request.httpParameterMap;
    var regexParam = /dwfrm_cart_shipments_(.*)_items_(.*)_quantity/gim;
    var itemsToChangeInfo = [];

    for (var i = 2; i < params.parameterNames.length; i++) {
        var param = params.parameterNames[i];
        var paramMatches = param.match(regexParam);
        if (paramMatches && paramMatches[0] === param) {
            var paramValues = param.match(/\d/g);
            var itemToChange = {
                shipment: paramValues[0],
                position: paramValues[1],
                newQuantity: params[params.parameterNames[i]].value
            };
            itemsToChangeInfo.push(itemToChange);
        }
    }

    var data = getItemsData(itemsToChangeInfo, cart);

    var strData = JSON.stringify(data);
    session.custom.analyticsPayload = strData;
}

/**
 * Set extend analytics data after cart update
 * @param {Object} cart the cart model
 * @param {Object} productsToUpdate array of pli to update
 * @returns {void}
 */
function setUpdateCartPayload(cart) {
    if (!session.custom.analyticsPayload) {
        session.custom.analyticsPayload = '';
        return;
    }

    var productsToUpdate = JSON.parse(session.custom.analyticsPayload);
    var itemsData = [];

    productsToUpdate = productsToUpdate.array ? productsToUpdate.array : productsToUpdate;

    if (productsToUpdate) {
        for (var i = 0; i < productsToUpdate.length; i++) {
            var extendProduct,
                extendedProduct;
            var data = {};
            var product = productsToUpdate[i];
            var productLineItems = cart.productLineItems;
            var isProductExist = false;
    
            for (var j = 0; j < productLineItems.length; j++) {
                var item = productLineItems[j];
                if (item.UUID === product.UUID) {
                    isProductExist = true;
                    if (product.quantityValue !== item.quantityValue) {
                        if (item.custom.persistentUUID) {
                            extendProduct = getExtendProduct(productLineItems, item);
    
                            if (!extendProduct) {
                                data.event = 'productUpdated';
                                itemsData.push(getProductUpdatedData(item, data));
                            }
                        } else if (item.custom.parentLineItemUUID) {
                            extendedProduct = getExtendedProduct(productLineItems, item);
                            data.event = 'offerUpdated';
                            var newData = getOfferUpdatedData(extendedProduct, item, data);
    
                            if (product.quantityValue !== newData.warrantyQuantity) {
                                itemsData.push(newData);
                            }
                        } else {
                            data.event = 'productUpdated';
                            itemsData.push(getProductUpdatedData(item, data));
                        }
                    }
                }
            }
    
            if (!isProductExist && +product.newQuantity === 0) {
                data.productID = product.productID;
                if (product.planId) {
                    data.planId = product.planId;
                    data.event = 'offerRemovedFromCart';
                    itemsData.push(data);
                    break;
                } else {
                    data.event = 'productRemovedFromCart';
                }
                itemsData.push(data);
            }
        }
    }
    var newData = {
        array: itemsData
    };

    var strData = JSON.stringify(newData);

    session.custom.analyticsPayload = strData;
}

/**
 * Set extend analytics data after delete product
 * @param {Object} cart the cart model
 * @param {Object} object product to delete
 * @returns {void}
 */
function setDeleteProductPayload(cart, object) {
    var extendProduct,
        extendedProduct;
    var itemsData = [];
    var data = {};

    extendProduct = getExtendProduct(cart.object.productLineItems, object);

    if (object.custom.parentLineItemUUID) {
        extendedProduct = getExtendedProduct(cart.object.productLineItems, object);
        itemsData.push(getOfferRemovedFromCartData(extendedProduct, object));
    } else if (object.custom.persistentUUID && extendProduct) {
        itemsData.push(getOfferRemovedFromCartData(object, extendProduct));
    } else {
        itemsData.push(getProductRemovedFromCartData(object));
    }

    var newData = {
        array: itemsData
    };

    var strData = JSON.stringify(newData);

    session.custom.analyticsPayload = strData;
}

/**
 * Get extend analytics data and clear session
 * @returns {Object} extend analytics data
 */
function getAnalyticsPayload() {
    var payload = session.custom.analyticsPayload || '';

    session.custom.analyticsPayload = '';

    return payload;
}

/* Exported Methods */
module.exports = {
    getUpdateCartData: getUpdateCartData,
    setUpdateCartPayload: setUpdateCartPayload,
    setDeleteProductPayload: setDeleteProductPayload,
    getAnalyticsPayload: getAnalyticsPayload
};
