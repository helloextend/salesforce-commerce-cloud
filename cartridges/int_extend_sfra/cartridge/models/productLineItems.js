/* eslint-disable no-use-before-define */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Creates an array of product line items
 * @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
 * line items of the basket
 * @param {string} view - the view of the line item (basket or order)
 * @returns {Array} an array of product line items.
 */
function createProductLineItemsObject(allLineItems, view) {
    var lineItems = [];

    collections.forEach(allLineItems, function (item) {
        // when item's category is unassigned, return a lineItem with limited attributes
        if (!item.product) {
            lineItems.push({
                id: item.productID,
                quantity: item.quantity.value,
                productName: item.productName,
                UUID: item.UUID,
                noProduct: true,
                images:
                {
                    small: [
                        {
                            url: URLUtils.staticURL('/images/noimagelarge.png'),
                            alt: Resource.msgf('msg.no.image', 'common', null),
                            title: Resource.msgf('msg.no.image', 'common', null)
                        }
                    ]

                }

            });
            return;
        }
        var options = collections.map(item.optionProductLineItems, function (optionItem) {
            return {
                optionId: optionItem.optionID,
                selectedValueId: optionItem.optionValueID
            };
        });

        var bonusProducts = null;

        if (!item.bonusProductLineItem
                && item.custom.bonusProductLineItemUUID
                && item.custom.preOrderUUID) {
            bonusProducts = [];
            collections.forEach(allLineItems, function (bonusItem) {
                if (!!item.custom.preOrderUUID && bonusItem.custom.bonusProductLineItemUUID === item.custom.preOrderUUID) {
                    var bpliOptions = collections.map(bonusItem.optionProductLineItems, function (boptionItem) {
                        return {
                            optionId: boptionItem.optionID,
                            selectedValueId: boptionItem.optionValueID
                        };
                    });
                    var params = {
                        pid: bonusItem.product.ID,
                        quantity: bonusItem.quantity.value,
                        variables: null,
                        pview: 'bonusProductLineItem',
                        containerView: view,
                        lineItem: bonusItem,
                        options: bpliOptions
                    };

                    bonusProducts.push(ProductFactory.get(params));
                }
            });
        }

        var params = {
            pid: item.product.ID,
            quantity: item.quantity.value,
            variables: null,
            pview: 'productLineItem',
            containerView: view,
            lineItem: item,
            options: options
        };
        var newLineItem = ProductFactory.get(params);
        newLineItem.bonusProducts = bonusProducts;
        if (newLineItem.bonusProductLineItemUUID === 'bonus' || !newLineItem.bonusProductLineItemUUID) {
            lineItems.push(newLineItem);
        }

        // BEGIN Extend integration
        if ((item.custom.parentLineItemUUID && view !== 'order') || (!item.custom.parentLineItemUUID && item.custom.isWarranty)) {
            lineItems.pop();

            var extendLineItem = JSON.parse(JSON.stringify(newLineItem));
            extendLineItem.productName = item.productName;
            if (extendLineItem.price) {
                extendLineItem.price.sales = {
                    currency: item.basePrice.currencyCode,
                    decimalPrice: item.basePrice.toNumberString(),
                    formatted: item.basePrice.toFormattedString(),
                    value: item.basePrice.getDecimalValue()
                };
            }
            extendLineItem.renderedPrice = getRenderedPrice(extendLineItem.price);

            lineItems.push(extendLineItem);
        }

        // Extend Shipping Protection Item
        if (item.custom.isExtendShippingProtection) {
            lineItems.pop();

            var shippingProtectionLineItem = JSON.parse(JSON.stringify(newLineItem));
            shippingProtectionLineItem.productName = item.productName;
            if (shippingProtectionLineItem.price) {
                shippingProtectionLineItem.price.sales = {
                    currency: item.basePrice.currencyCode,
                    decimalPrice: item.basePrice.toNumberString(),
                    formatted: item.basePrice.toFormattedString(),
                    value: item.basePrice.getDecimalValue()
                };
            }
            shippingProtectionLineItem.renderedPrice = getRenderedPrice(shippingProtectionLineItem.price);

            lineItems.push(shippingProtectionLineItem);
        }

        // END Extend integration
    });
    return lineItems;
}

/**
  * Renders pricing template for line item
  * @param {Object} price - Factory price
  * @return {string} - Rendered HTML
  */
function getRenderedPrice(price) {
    var context = {
        price: price
    };
    return priceHelper.renderHtml(priceHelper.getHtmlContext(context));
}

/**
 * Loops through all of the product line items and adds the quantities together.
 * @param {dw.util.Collection<dw.order.ProductLineItem>} items - All product
 * line items of the basket
 * @returns {number} a number representing all product line items in the lineItem container.
 */
function getTotalQuantity(items) {
    var totalQuantity = 0;
    collections.forEach(items, function (lineItem) {
        totalQuantity += lineItem.quantity.value;
    });

    return totalQuantity;
}

/**
 * @constructor
 * @classdesc class that represents a collection of line items and total quantity of
 * items in current basket or per shipment
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - the product line items
 *                                                       of the current line item container
 * @param {string} view - the view of the line item (basket or order)
 */
function ProductLineItems(productLineItems, view) {
    if (productLineItems) {
        this.items = createProductLineItemsObject(productLineItems, view);
        this.totalQuantity = getTotalQuantity(productLineItems);
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

ProductLineItems.getTotalQuantity = getTotalQuantity;

module.exports = ProductLineItems;
