'use strict';

/**
 * Get extend product from basket
 * @param {dw.order.Basket} currentBasket
 * @param {dw.order.ProductLineItem} persistentItem
 * @returns {dw.order.ProductLineItem} - extend product with parentLineItemUUID === persistentItem
 */
function getExtendProduct(currentBasket, persistentItem) {
    var productLineItems = currentBasket.getAllProductLineItems()
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
function getExtendedProduct(currentBasket, parentLineItem) {
    var productLineItems = currentBasket.getAllProductLineItems()
    for (var i = 0; i < productLineItems.length; i++) {
        if (parentLineItem.custom.parentLineItemUUID === productLineItems[i].custom.persistentUUID) {
            return productLineItems[i];
        }
    }
}

/**
 * Сheck if the product is extend product by uuid
 * @param {dw.order.ProductLineItem} productLineItem
 * @param {String} uuid
 * @returns {boolean} - true if product is extend product
 */
function isExtendProduct(productLineItem, uuid) {
    if (
        productLineItem.UUID === uuid &&
        productLineItem.custom.parentLineItemUUID
    ) {
        return true;
    }
}

/**
 * Get data for trackOfferUpdated event
 * @param {dw.order.ProductLineItem} updatedProduct
 * @param {dw.order.ProductLineItem} updatedPlan
 * @returns {Object} - data for trackOfferUpdated event
 */
function getOfferUpdatedData(updatedProduct, updatedPlan) {
    var offerUpdated = {
        productId: updatedProduct.productID,
        planId: updatedPlan.manufacturerSKU,
        warrantyQuantity: updatedPlan.quantityValue,
        productQuantity: updatedProduct.quantityValue,
        event: 'offerUpdated'
    }

    return offerUpdated;
}

/**
 * Get data for trackProductUpdated event
 * @param {dw.order.ProductLineItem} updatedProduct
 * @returns {Object} - data for trackProductUpdated event
 */
function getProductUpdatedData(updatedProduct) {
    var productUpdated = {
        productId: updatedProduct.productID,
        productQuantity: updatedProduct.quantityValue,
        event: 'productUpdated'
    }

    return productUpdated;
}

/**
 * Get data for trackProductRemovedFromCart event
 * @param {dw.order.ProductLineItem} removedProduct
 * @returns {Object} - data for trackProductRemovedFromCart event
 */
function getProductRemovedFromCartData(removedProduct) {
    var productRemovedFromCart = {
        productId: removedProduct.productID,
        event: 'productRemovedFromCart'
    }

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
        referenceId: removedProduct.productID,
        planId: removedPlan.manufacturerSKU,
        event: 'offerRemovedFromCart'
    }

    return offerRemovedFromCart;
}


/* Exported Methods */
module.exports = {
    getExtendProduct: getExtendProduct,
    getExtendedProduct: getExtendedProduct,
    getOfferUpdatedData: getOfferUpdatedData,
    isExtendProduct: isExtendProduct,
    getProductUpdatedData: getProductUpdatedData,
    getProductRemovedFromCartData: getProductRemovedFromCartData,
    getOfferRemovedFromCartData: getOfferRemovedFromCartData
};
