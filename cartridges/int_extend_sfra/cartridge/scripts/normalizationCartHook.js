/* eslint-disable */
'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');

/**
 * @function normalizeCartQuantities
 *
 * The function provides normalization to cart between product quantity and warranty items quantity to keep them equal.
 *
 * @param {object} basket The current basket containing all added products and warranties
 */
function normalizeCartQuantities(basket) {
    var productLineItems = basket.getProductLineItems();

    var productsWithWarranty = [];
    var warrantyItems = [];

    collections.forEach(productLineItems, function (lineItem) {

        var persistentUUID = lineItem.custom.persistentUUID || null;
        var parentLineItemUUID = lineItem.custom.parentLineItemUUID || null;

          // Is LineItem with warranty
          if (persistentUUID && !parentLineItemUUID) {
                productsWithWarranty.push(lineItem);
          }

          // Is warranty line item
          if (persistentUUID && parentLineItemUUID) {
                warrantyItems.push(lineItem);
          }
    });

    if (warrantyItems.length > 0) {
        var mappedLineItemProducts = mapProductWithWarranties(productsWithWarranty, warrantyItems);

        if (warrantyItems.length > productsWithWarranty.length ) {
            productsWithWarranty.forEach( function (productLineItem) {
                warrantyItems.forEach( function (warrantyLineItem) {
                    if (warrantyLineItem.custom.parentLineItemUUID !== productLineItem.custom.persistentUUID) {
                        basket.removeProductLineItem(warrantyLineItem);
                    }
                });
            });
        }

        if (empty(mappedLineItemProducts)) {
                warrantyItems.forEach( function (warrItem) {
                basket.removeProductLineItem(warrItem);
            });
        }
        Transaction.wrap(function () {
            applyQuantityLogic(mappedLineItemProducts);
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

        // Make quantity equal if W quantities < P total quantities
        if (totalQuantityWarrantyProducts < quantityOfProduct) {
            addQuantityToHighestWarranty(quantityOfProduct - totalQuantityWarrantyProducts, warrantyProducts);
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

module.exports = normalizeCartQuantities;