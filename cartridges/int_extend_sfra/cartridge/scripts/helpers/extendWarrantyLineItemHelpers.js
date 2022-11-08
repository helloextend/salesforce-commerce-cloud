/** This helper implements the logic of adding a new line item to the cart and processing it  */

/* eslint-disable no-useless-concat */

'use strict';

var Transaction = require('dw/system/Transaction');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

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
 * Handle Extend add to cart
 * @param {dw.order.Basket} currentBasket - current basket
 * @param {dw.catalog.Product} product - product
 * @param {dw.order.ProductLineItem} parentLineItem - parent line item
 * @param {Object} form - form
 */
function addExtendWarrantyToCart(currentBasket, product, parentLineItem, form) {
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

    // Configure the Extend ProductLineItem
    Transaction.wrap(function () {
        warrantyLi.setProductName('Extend Protection Plan' + ' for ' + form.productName);
        warrantyLi.setManufacturerSKU(form.extendPlanId);
        warrantyLi.setPriceValue(parseFloat(form.extendPrice) / 100);
        warrantyLi.setQuantityValue(parseInt(form.quantity, 10));
        warrantyLi.custom.isWarranty = true;
        if (form.leadToken) {
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
