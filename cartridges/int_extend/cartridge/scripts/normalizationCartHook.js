/* eslint-disable */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');

/**
 * @function normalizeCartQuantities
 *
 * The function provides normalization to cart between product quantity and warranty items quantity to keep them equal.
 *
 * @param {object} basket The current basket containing all added products and warranties
 */

function normalizeCartQuantities(basket) {
    var extendShippingProtectionHelpers = require('*/cartridge/scripts/extendShippingProtectionHelpers');

    var productLineItems = basket.getProductLineItems();

    var productsWithWarranty = [];
    var warrantyItems = [];
    var leadsLineItems = [];
    var productsToShippingProtection = []

    if (basket) {
        productsToShippingProtection = extendShippingProtectionHelpers.getProductToCreateQuotes(basket)
    }

    collections.forEach(productLineItems, function (lineItem) {

        var persistentUUID = lineItem.custom.persistentUUID || null;
        var parentLineItemUUID = lineItem.custom.parentLineItemUUID || null; 

          // Is LineItem with warranty
          if (persistentUUID && !parentLineItemUUID) { 
                productsWithWarranty.push(lineItem);
          }

          // Is warranty line item
          if (!persistentUUID && parentLineItemUUID) {
                warrantyItems.push(lineItem);
          }

        // Is LineItem leadOffer
        var leadExtendId = lineItem.custom.leadExtendId;
        var postPurchaseLeadToken = lineItem.custom.postPurchaseLeadToken;

        if (leadExtendId && postPurchaseLeadToken) {
            leadsLineItems.push(lineItem);
        }
    });

    if (leadsLineItems) {
        Transaction.wrap(function () {
            normalizeLeadOffersQuantities(leadsLineItems)
        })
    }

    if (warrantyItems.length > 0) {
        var mappedLineItemProducts = mapProductWithWarranties(productsWithWarranty, warrantyItems);

        Transaction.wrap(function () {
            applyQuantityLogic(mappedLineItemProducts);
        });
    }

    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitchCartPage');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        Transaction.wrap(function () {
            extendShippingProtectionNormalizeCart(basket, productsToShippingProtection);
        });
    }
}

/**
 * Normalize cart after removing all the product (remove extend Shipping Protectio)
 * @param {Object} basket - current basket
 */
function extendShippingProtectionNormalizeCart (basket, productsToShippingProtection) {
    var isShippingProtectionFound = false;
    var shippingProtectionLineItem = null;

    var allLineItems = basket.getAllProductLineItems();
    collections.forEach(allLineItems, function (productLineItem) {
        if (productLineItem.custom.isExtendShippingProtection) {
            isShippingProtectionFound = true;
            shippingProtectionLineItem = productLineItem;
        }
    });

    if (!productsToShippingProtection.length && shippingProtectionLineItem ) {
        basket.removeProductLineItem(shippingProtectionLineItem);

        Transaction.wrap(function () {
            basket.custom.isExtendShippingProtectionAdded = false;
            basket.custom.isExtendShippingProtectionRemoved = true;
        });
    }
}

 /**
 * @function applyQuantityLogic
 *
 * Entrypoint method that contains logic of normalization cart requirements
 *
 * @param {Array.<Object>} mappedProducts - mapped array with objects of ProductLineItem 
 * and all Warranty products linked with that product 
 */

function applyQuantityLogic (mappedProducts) {
    mappedProducts.forEach(function (mappedObject) { 
        
        var lineItem = mappedObject.lineItem; 
        var warrantyProducts = mappedObject.warranties;
        var quantityOfProduct = lineItem.getQuantityValue();
        
        var totalQuantityWarrantyProducts = warrantyProducts.reduce(function (prev, item) {
            return prev += item.getQuantityValue();
        }, 0);

        // Make quantity equal if P quantities < W total quantities 
        if (quantityOfProduct < totalQuantityWarrantyProducts) {
            makeQuantityEqual(totalQuantityWarrantyProducts - quantityOfProduct, warrantyProducts);
        }

        // quantity of warranty needed to add to normalize cart quantities
        var quantityToAdd = quantityOfProduct - totalQuantityWarrantyProducts;

        // Make quantity equal if W quantities < P total quantities
        if (quantityOfProduct > totalQuantityWarrantyProducts && quantityToAdd >= 1) {
            addQuantityToHighestWarranty(quantityToAdd, warrantyProducts);
        }
    });
}

/**
 * @function addQuantityToHighestWarranty
 *
 * Provide logic to make Products quantity and Warranty product quantity equal
 * by increasing quantity with highest price of Extend ProductLineItem 
 * 
 * @param {Number} numberToAdd - Numbers of the quantity that should be increased
 * @param {Array.<{ProductLineItem}>} warrantyProducts - Collection of EXTEND ProductLineItem 
 * 
 */

function addQuantityToHighestWarranty (numberToAdd, warrantyProducts) {
    var countToAdd = numberToAdd;
    var warrantyProductsDESC = reverseArray(warrantyProducts);

    warrantyProductsDESC.forEach(function (warrProduct) {
        var warrProductQuantity = warrProduct.getQuantityValue();
        var warrOptionProducts = warrProduct.optionProductLineItems[0];

        if (countToAdd > 0) {
            while (countToAdd > 0) {
                var warrProductQuantity = warrProduct.getQuantityValue(); 
                var warrOptionProducts = warrProduct.optionProductLineItems[0];

                warrProduct.setQuantityValue(warrProductQuantity + 1);
                warrOptionProducts.setQuantityValue(warrProductQuantity + 1);

                countToAdd--;
            }
        }
    });
}

/**
 * @function makeQuantityEqual
 *
 * Provide logic to make Products quantity and Warranty product quantity equal
 * by decreasing quantity with lowest price of Extend ProductLineItem 
 * 
 * @param {Number} numberToRemove - Numbers of the quantity that should be decreased
 * @param {Array.<{ProductLineItem}>} warrantyProducts - Collection of EXTEND ProductLineItem 
 * 
 */

function makeQuantityEqual (numberToRemove, warrantyProducts) {
    var countToRemove = numberToRemove;
    var currentBasket = BasketMgr.getCurrentBasket();

    warrantyProducts.forEach(function (warrProduct) {
        var warrProductQuantity = warrProduct.getQuantityValue();
        
        if (countToRemove > 0) {

            while (countToRemove > 0) {
                var warrProductQuantity = warrProduct.getQuantityValue();
                
                if (warrProductQuantity > 1) {
                    var warrOptionProducts = warrProduct.optionProductLineItems[0];
        
                    warrProduct.setQuantityValue(warrProductQuantity - 1);
                    warrOptionProducts.setQuantityValue(warrProductQuantity - 1);
                }

                if (countToRemove >= warrProductQuantity && warrProductQuantity === 1) { 
                    currentBasket.removeProductLineItem(warrProduct);
                    normalizeCartQuantities(BasketMgr.getCurrentBasket());
                }
                
                countToRemove--;
            }  
        } 
    }); 

}

/**
 * @function mapProductWithWarranties
 *
 * Creates mapped array with object that contains mapped ProductLineItem 
 * with all warranties that added to this ProductLineItem 
 * 
 * @param {Array.<{ProductLineItem}>} productLineItems - Collection of all products that has warranty products
 * @param {Array.<{ProductLineItem}>} warrantyItems - Collection of all EXTEND products that has added to cart
 * 
 * @returns {Array.<Object>} - mapped array with objects of ProductLineItem and all Warranty products linked with that product
 */

function mapProductWithWarranties (productLineItems, warrantyItems) {
    var result = [];
    
    productLineItems.forEach(function (lineItem) {
        var UUID = lineItem.getUUID();
        
        var warrantyProductByPriceASC = warrantyItems.filter (function (warrantyProduct) {
            return warrantyProduct.custom.parentLineItemUUID === UUID;
        }).sort(function (a, b) {
            var basePriceA = a.basePrice.decimalValue;
            var basePriceB = b.basePrice.decimalValue;
            return basePriceA - basePriceB;
        });
         
        result.push({
            UUID: UUID,
            lineItem: lineItem,
            warranties: warrantyProductByPriceASC
        });
 
    }); 
    
    return result;
}

/**
 * @function reverseArray
 *
 * Creates new reversed Array
 * 
 * @param {Array>} warrantyArr - Array that should be reversed
 * 
 * @returns {Array} - new reversed Array
 */
function reverseArray (warrantyArr) {
    var result = [];
    var index = warrantyArr.length - 1;

    while (index >= 0) { 
        result.push(warrantyArr[index]);
        index--;
    }

    return result;
}

/**
 * Normalize lead offers quantities in cart
 * @param {Array} leadsLineItems - array of leads line items
 * @returns {Array} new normalized array
 */
 function normalizeLeadOffersQuantities(leadsLineItems) {
    leadsLineItems.forEach(function (lead) {
        var quantityOfLead = lead.getQuantityValue();

        if (quantityOfLead > lead.custom.leadQuantuty) {
            lead.setQuantityValue(lead.custom.leadQuantuty);
        }
    })
}

module.exports = normalizeCartQuantities;