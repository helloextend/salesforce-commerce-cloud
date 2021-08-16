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
	if(dw.system.Site.current.preferences.custom.extendGlobalSwitch) {
	    collections.forEach(basket.getAllProductLineItems(), function (lineItem) {
	    	if(!empty(lineItem.custom.parentLineItemUUID)){
	    		var warrantedPLI = getWarrantedItem(basket,lineItem.custom.parentLineItemUUID);
	    		if(!empty(warrantedPLI)) {
	    			Transaction.wrap(function () {
	    				lineItem.setQuantityValue(warrantedPLI.getQuantityValue());
	                });
	    		}
	    	}
	    });
	}
}

function getWarrantedItem(basket,uuid) {
	var warrantedPLI;
	collections.forEach(basket.getAllProductLineItems(), function (lineItem) {
          // Is LineItem with warranty
          if (lineItem.getUUID() === uuid) { 
        	  warrantedPLI =  lineItem;
          } 
    });
	return warrantedPLI;
}

module.exports = normalizeCartQuantities;