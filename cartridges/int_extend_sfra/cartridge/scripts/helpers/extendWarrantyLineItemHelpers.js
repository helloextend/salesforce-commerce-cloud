/* eslint-disable no-param-reassign */
/* eslint-disable radix */
/** This helper implements the logic of adding a new line item to the cart and processing it  */

/* eslint-disable no-useless-concat */

'use strict';

/**
 * Set the quantity
 * @param {string} currentWarrantyLi - current warranty list
 * @param {Object} form - form
 */
function updateExtendWarranty(currentWarrantyLi, form) {
    var Transaction = require('dw/system/Transaction');
    var quantityInCart = currentWarrantyLi.getQuantity();

    Transaction.wrap(function () {
        currentWarrantyLi.setQuantityValue(quantityInCart + parseInt(form.quantity, 10));
    });
}

/**
 * Handle Extend add to cart
 * @param {Object} currentBasket - current basket
 * @param {Object} product - current product
 * @param {Object} parentLineItem - parrent line item
 * @param {Object} form - info about the extension (id etc.)
 */
function addExtendWarrantyToCart(currentBasket, product, parentLineItem, form) {
    var Transaction = require('dw/system/Transaction');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var warrantyLi;

    if (!currentBasket) {
        return;
    }

    // Add new line item for the Extend warranty
    Transaction.wrap(function () {
        warrantyLi = cartHelper.addLineItem(
            currentBasket,
            product,
            parseInt(form.quantity, 10),
            [],
            product.getOptionModel(),
            currentBasket.getDefaultShipment()
        );
    });

    var warrantyName = parentLineItem ? parentLineItem.getProductName() : form.productName;

    // Configure the Extend ProductLineItem
    Transaction.wrap(function () {
        warrantyLi.setProductName('Extend Product Protection: ' + parseInt(form.extendTerm / 12) + ' years for ' + warrantyName);
        warrantyLi.setManufacturerSKU(form.extendPlanId);
        warrantyLi.setPriceValue(parseFloat(form.extendPrice) / 100);
        warrantyLi.setQuantityValue(parseInt(form.quantity, 10));
        warrantyLi.custom.persistentUUID = warrantyLi.UUID;
        warrantyLi.custom.isWarranty = true;
        if (parentLineItem) {
            warrantyLi.custom.parentLineItemUUID = parentLineItem.UUID;
            parentLineItem.custom.persistentUUID = parentLineItem.UUID;
        } else if (form.leadToken) {
            warrantyLi.custom.leadExtendId = form.extendPlanId;
            warrantyLi.custom.leadQuantuty = +form.quantity;
            warrantyLi.custom.postPurchaseLeadToken = form.leadToken;
        }
    });
}

module.exports = {
    updateExtendWarranty: updateExtendWarranty,
    addExtendWarrantyToCart: addExtendWarrantyToCart
};
