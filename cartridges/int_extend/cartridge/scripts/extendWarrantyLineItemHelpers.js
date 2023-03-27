/* eslint-disable radix */

/** This helper implements the logic of adding a new line item to the cart and processing it  */

/* eslint-disable no-useless-concat */

'use strict';

var Transaction = require('dw/system/Transaction');
var normalizeCartQuantities = require('*/cartridge/scripts/normalizationCartHook');

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
* @param {Object} form The form object
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
        warrantyLi.custom.planId = form.extendPlanId;
        if (form.leadToken) {
            warrantyLi.custom.leadExtendId = form.extendPlanId;
            warrantyLi.custom.leadQuantuty = +form.quantity;
            warrantyLi.custom.postPurchaseLeadToken = form.leadToken;
        }

        // Normalize cart quatities for extend warranty items
        normalizeCartQuantities(currentBasket);

        cart.calculate();
    });
}

module.exports = {
    updateExtendWarranty: updateExtendWarranty,
    createExtendLineItem: createExtendLineItem
};
