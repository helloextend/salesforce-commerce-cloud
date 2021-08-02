'use strict';

function getExtendProduct(currentBasket, persistentItem) {
    var productLineItems = currentBasket.getAllProductLineItems()
    for (var i = 0; i < productLineItems.length; i++) {
        if (persistentItem.custom.persistentUUID === productLineItems[i].custom.parentLineItemUUID) {
            return productLineItems[i];
        }
    }
}

function getExtendedProduct(currentBasket, parentLineItem) {
    var productLineItems = currentBasket.getAllProductLineItems()
    for (var i = 0; i < productLineItems.length; i++) {
        if (parentLineItem.custom.parentLineItemUUID === productLineItems[i].custom.persistentUUID) {
            return productLineItems[i];
        }
    }
}

function isExtendProduct(productLineItems, uuid) {
    if (
        productLineItems.UUID === uuid &&
        productLineItems.custom.parentLineItemUUID
    ) {
        return true;
    }
}

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

function getProductUpdatedData(updatedProduct) {
    var productUpdated = {
        productId: updatedProduct.productID,
        productQuantity: updatedProduct.quantityValue,
        event: 'productUpdated'
    }

    return productUpdated;
}

function getProductRemovedFromCartData(removedProduct) {
    var productRemovedFromCart = {
        productId: removedProduct.productID,
        event: 'productRemovedFromCart'
    }

    return productRemovedFromCart;
}

function getOfferRemovedFromCartData(removedProduct, removedPlan) {
    var offerRemovedFromCart = {
        referenceId: removedProduct.productID,
        planId: removedPlan.manufacturerSKU,
        event: 'offerRemovedFromCart'
    }

    return offerRemovedFromCart;
}

function getProductAddedToCartData(addedProduct, form) {
    var productAddedToCart = {
        productId: addedProduct.productID,
        productQuantity: parseInt(form.quantity, 10),
        event: 'productAddedToCart'
    }

    return productAddedToCart;
}

function getOfferAddedToCartData(addedOffer, addedProduct, form) {
    var offerAddedToCart = {
        productId: addedProduct.productID,
        productQuantity: parseInt(form.quantity, 10),
        planId: addedOffer.manufacturerSKU,
        offerTypeArea: form.offerTypeArea,
        offerTypeComponent: form.offerTypeComponent,
        event: 'offerAddedToCart'
    }

    return offerAddedToCart;
}

/* Exported Methods */
module.exports = {
    getExtendProduct: getExtendProduct,
    getExtendedProduct: getExtendedProduct,
    getOfferUpdatedData: getOfferUpdatedData,
    isExtendProduct: isExtendProduct,
    getProductUpdatedData: getProductUpdatedData,
    getProductRemovedFromCartData: getProductRemovedFromCartData,
    getOfferRemovedFromCartData: getOfferRemovedFromCartData,
    getProductAddedToCartData: getProductAddedToCartData,
    getOfferAddedToCartData: getOfferAddedToCartData
};
