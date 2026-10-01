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
 * Configure an Extend warranty ProductLineItem.
 * @param {Object} warrantyLi - warranty line item
 * @param {Object} parentLineItem - parent product line item
 * @param {Object} form - warranty request data
 * @param {Object} offerInfo - validated offer data
 */
function configureWarrantyLineItem(warrantyLi, parentLineItem, form, offerInfo) {
    var warrantyName = parentLineItem ? parentLineItem.getProductName() : form.productName;
    var warrantyPrice = offerInfo.isEmbedded ? 0 : (parseFloat(form.extendPrice) / 100);

    warrantyLi.setProductName('Extend Product Protection: ' + parseInt(form.extendTerm / 12) + ' years for ' + warrantyName);
    warrantyLi.setManufacturerSKU(form.extendPlanId);
    warrantyLi.setPriceValue(warrantyPrice);
    warrantyLi.setQuantityValue(parseInt(form.quantity, 10));
    warrantyLi.custom.persistentUUID = warrantyLi.UUID;
    warrantyLi.custom.isWarranty = true;
    warrantyLi.custom.isEmbedded = offerInfo.isEmbedded || false;
    warrantyLi.custom.planId = form.extendPlanId;
    if (offerInfo.coverageType) {
        warrantyLi.custom.coverageType = offerInfo.coverageType;
    }
    if (parentLineItem) {
        warrantyLi.custom.parentLineItemUUID = parentLineItem.UUID;
        parentLineItem.custom.persistentUUID = parentLineItem.UUID;
    } else if (form.leadToken) {
        warrantyLi.custom.leadExtendId = form.extendPlanId;
        warrantyLi.custom.leadQuantuty = +form.quantity;
        warrantyLi.custom.postPurchaseLeadToken = form.leadToken;
    }
}

/**
 * Add a warranty line item without opening a transaction.
 * @param {Object} currentBasket - current basket
 * @param {Object} product - warranty product
 * @param {Object} parentLineItem - parent product line item
 * @param {Object} form - warranty request data
 * @param {Object} offerInfo - validated offer data
 * @returns {Object} created warranty line item
 */
function addWarrantyLineItem(currentBasket, product, parentLineItem, form, offerInfo) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var warrantyLi = cartHelper.addLineItem(
        currentBasket,
        product,
        parseInt(form.quantity, 10),
        [],
        product.getOptionModel(),
        currentBasket.getDefaultShipment()
    );

    configureWarrantyLineItem(warrantyLi, parentLineItem, form, offerInfo);
    return warrantyLi;
}

/**
 * Handle Extend add to cart
 * @param {Object} currentBasket - current basket
 * @param {Object} product - current product
 * @param {Object} parentLineItem - parrent line item
 * @param {Object} form - info about the extension (id etc.)
 */
function addExtendWarrantyToCart(currentBasket, product, parentLineItem, form, offerInfo) {
    var Transaction = require('dw/system/Transaction');

    if (!currentBasket) {
        return;
    }

    Transaction.wrap(function () {
        addWarrantyLineItem(currentBasket, product, parentLineItem, form, offerInfo);
    });
}

/**
 * Replace paid, non-embedded warranties with the current embedded offer.
 * Existing embedded warranties are retained to keep the operation idempotent.
 * @param {Object} currentBasket - current basket
 * @param {Object} product - embedded warranty product
 * @param {Object} parentLineItem - parent product line item
 * @param {Object} form - embedded warranty request data
 * @param {Object} offerInfo - validated embedded offer data
 * @returns {boolean} whether a paid warranty was replaced
 */
function replacePaidWarrantyWithEmbedded(currentBasket, product, parentLineItem, form, offerInfo) {
    var Transaction = require('dw/system/Transaction');
    var replaced = false;

    if (!currentBasket || !product || !parentLineItem) {
        return replaced;
    }

    Transaction.wrap(function () {
        var warrantyItems = currentBasket.getProductLineItems();
        var embeddedWarrantyExists = false;
        var parentUUID = parentLineItem.UUID;

        for (var i = 0; i < warrantyItems.length; i++) {
            var warrantyItem = warrantyItems[i];
            if (warrantyItem.custom.parentLineItemUUID !== parentUUID) {
                continue;
            }

            if (warrantyItem.custom.isEmbedded === true || warrantyItem.custom.isEmbedded === 'true') {
                embeddedWarrantyExists = true;
            }
        }

        for (var j = warrantyItems.length - 1; j >= 0; j--) {
            var currentWarranty = warrantyItems[j];
            var currentWarrantyPrice = currentWarranty.price && currentWarranty.price.value;
            var isPaidWarranty = currentWarrantyPrice !== undefined && currentWarrantyPrice > 0;
            var isEmbeddedWarranty = currentWarranty.custom.isEmbedded === true || currentWarranty.custom.isEmbedded === 'true';

            if (currentWarranty.custom.parentLineItemUUID === parentUUID && isPaidWarranty && !isEmbeddedWarranty) {
                currentBasket.removeProductLineItem(currentWarranty);
                replaced = true;
            }
        }

        if (replaced && !embeddedWarrantyExists) {
            addWarrantyLineItem(currentBasket, product, parentLineItem, form, offerInfo);
        }
    });

    return replaced;
}

module.exports = {
    updateExtendWarranty: updateExtendWarranty,
    addExtendWarrantyToCart: addExtendWarrantyToCart,
    replacePaidWarrantyWithEmbedded: replacePaidWarrantyWithEmbedded
};
