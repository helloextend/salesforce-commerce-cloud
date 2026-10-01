/* eslint-disable no-undef */
'use strict';

var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
var ProductMgr = require('dw/catalog/ProductMgr');
var extend = require('~/cartridge/scripts/extend');
var extendHelpers = require('~/cartridge/scripts/helpers/extendHelpers');
var warrantyLineItemHelpers = require('~/cartridge/scripts/helpers/extendWarrantyLineItemHelpers');

/**
 * Return the category used by the existing cart offer lookup.
 * @param {Object} product - SFCC product
 * @returns {string|undefined} category id
 */
function getProductCategory(product) {
    if (!product) {
        return;
    }

    if (product.variant && product.masterProduct && product.masterProduct.primaryCategory) {
        return product.masterProduct.primaryCategory.getID();
    }

    if (product.primaryCategory) {
        return product.primaryCategory.getID();
    }
}

/**
 * Return a line item's attached warranty items.
 * @param {Object} basket - current basket
 * @param {string} parentUUID - parent line item UUID
 * @returns {Array} attached warranties
 */
function getAttachedWarranties(basket, parentUUID) {
    var result = [];
    var lineItems = basket.getProductLineItems();

    for (var i = 0; i < lineItems.length; i++) {
        if (lineItems[i].custom.parentLineItemUUID === parentUUID) {
            result.push(lineItems[i]);
        }
    }

    return result;
}

/**
 * Return paid warranties that are not marked embedded.
 * @param {Array} warranties - attached warranty line items
 * @returns {Array} paid non-embedded warranties
 */
function getPaidNonEmbeddedWarranties(warranties) {
    return warranties.filter(function (warranty) {
        var price = warranty.price && warranty.price.value;
        var isEmbedded = warranty.custom.isEmbedded === true || warranty.custom.isEmbedded === 'true';
        return !isEmbedded && price !== undefined && price > 0;
    });
}

/**
 * Return the existing warranty term to use when selecting the replacement plan.
 * @param {Object} warranty - warranty line item
 * @returns {string|undefined} plan term
 */
function getWarrantyTerm(warranty) {
    var productID = warranty.productID || (warranty.getProductID && warranty.getProductID());
    var match = String(productID || '').match(/^EXTEND-(.+)$/);
    return match ? match[1] : undefined;
}

/**
 * Re-evaluate current basket warranties against the current Extend offer.
 * Products without an existing paid, non-embedded warranty are intentionally ignored.
 * @param {Object} currentBasket - current basket
 * @returns {Object} replacement count
 */
function syncEmbeddedWarranties(currentBasket) {
    var result = { replaced: 0 };
    var parentLineItems = [];

    if (!currentBasket) {
        return result;
    }

    var lineItems = currentBasket.getProductLineItems();
    for (var i = 0; i < lineItems.length; i++) {
        var lineItem = lineItems[i];
        if (!lineItem.custom.isWarranty && String(lineItem.productID || '').indexOf('EXTEND-') !== 0) {
            parentLineItems.push(lineItem);
        }
    }

    parentLineItems.forEach(function (parentLineItem) {
        var warranties = getAttachedWarranties(currentBasket, parentLineItem.UUID);
        var paidWarranties = getPaidNonEmbeddedWarranties(warranties);

        // This feature must not auto-add a plan to products that never had one.
        if (paidWarranties.length === 0) {
            return;
        }

        var parentProduct = parentLineItem.getProduct();
        var category = getProductCategory(parentProduct);
        var quantity = parentLineItem.getQuantityValue();

        if (!parentProduct || !category || !quantity) {
            return;
        }

        var offerRequest = {
            pid: parentLineItem.productID,
            price: (parentLineItem.price.value / quantity) * 100,
            category: category
        };

        try {
            var offer = extend.getOffer(offerRequest);
            var preferredTerm = getWarrantyTerm(paidWarranties[0]);
            var embeddedPlan = extendHelpers.getEmbeddedPlan(offer && offer.plans, preferredTerm);

            if (!embeddedPlan || !embeddedPlan.id || embeddedPlan.term === undefined || embeddedPlan.term === null) {
                return;
            }

            var warrantyProduct = ProductMgr.getProduct('EXTEND-' + embeddedPlan.term);
            if (!warrantyProduct) {
                return;
            }

            var replacementForm = {
                extendPlanId: embeddedPlan.id,
                extendPrice: 0,
                extendTerm: embeddedPlan.term,
                pid: parentLineItem.productID,
                price: offerRequest.price,
                category: category,
                quantity: quantity,
                productName: parentLineItem.getProductName()
            };
            var offerInfo = {
                isValid: true,
                isEmbedded: true,
                coverageType: embeddedPlan.contract && embeddedPlan.contract.coverageIncludes
            };

            if (warrantyLineItemHelpers.replacePaidWarrantyWithEmbedded(
                currentBasket,
                warrantyProduct,
                parentLineItem,
                replacementForm,
                offerInfo
            )) {
                result.replaced++;
            }
        } catch (error) {
            logger.error('Unable to sync embedded warranty for product {0}: {1}', parentLineItem.productID, error.message);
        }
    });

    return result;
}

module.exports = syncEmbeddedWarranties;
