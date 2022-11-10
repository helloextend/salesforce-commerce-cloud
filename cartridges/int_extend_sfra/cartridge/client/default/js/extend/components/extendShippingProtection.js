/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-concat */
/* eslint-disable valid-jsdoc */
'use strict';

const { data } = require("jquery");

var Extend = window.Extend || undefined;

// EXTEND SHIPPING PROTECTION

/**
 * Extend config is initialized
 */
function initExtend() {
    $(document).ready(function () {
        var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
        var EXT_ENVIRONMENT = window.EXT_ENVIRONMENT || undefined;
        Extend.config({ storeId: EXT_STORE_ID, environment: EXT_ENVIRONMENT });
    });
}

/**
 * Get and process extend shipping protection config
 */
function getAndProcessExtendShippingProtectionConfig() {
    var getESPConfigUrl = window.EXT_ESP_GET_CONFIG;

    if (getESPConfigUrl) {
        $.ajax({
            url: getESPConfigUrl,
            method: 'GET',
            success: function () {},
            error: function () {}
        });
    }
}

/**
 * Remove Shipping Protection From The Cart
 */
function removeShippingProtection() {
    var removeShippingProtectionUrl = window.EXT_SP_REMOVEFROMCART;

    if (removeShippingProtectionUrl) {
        $.spinner().start();

        $.ajax({
            url: removeShippingProtectionUrl,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                // $('body').trigger('cart:update', data);
                window.location.reload();
                $.spinner().stop();
            },
            error: function () {
                console.log('Error occurred: Shipping protection has not been deleted');
                window.location.reload();
                $.spinner().stop();
            }
        });
    }
}

/**
 * Add Shipping Protection to the cart
 */
function addShippingProtection() {
    var addShippingProtectionUrl = window.EXT_SP_ADDTOCART;

    if (addShippingProtectionUrl) {
        $.spinner().start();

        $.ajax({
            url: addShippingProtectionUrl,
            method: 'POST',
            success: function () {
                window.location.reload();
                $.spinner().stop();
            },
            error: function () {
                console.log('Error occurred: Shipping protection has not been added to the card')
                window.location.reload();
                $.spinner().stop();
            }
        });
    }
}

/**
 * Render the Shipping Protection iframe
 */
function renderOrUpdateSP(shippingOffersItem, isShippingProtectionInCart) {
    var shippingProtectionOfferId = 'extend-shipping-offer';
    var $shippingProtectionContainer = '.totals';

    if (!Extend.shippingProtection) {
        return;
    }

    if (Extend.shippingProtection._instance !== null) {
        Extend.shippingProtection.update({
            items: shippingOffersItem
        });
    } else {
        var shippingProtectionOffer = document.createElement('div');
        shippingProtectionOffer.id = shippingProtectionOfferId;
        shippingProtectionOffer.style.textAlign = 'end';

        if (document.querySelector($shippingProtectionContainer)) {
            document.querySelector($shippingProtectionContainer).prepend(shippingProtectionOffer);
        }

        Extend.shippingProtection.render({
            selector: '#extend-shipping-offer',
            items: shippingOffersItem,
            isShippingProtectionInCart: isShippingProtectionInCart,
            onEnable: function (quote) {
                console.log('call back to add SP plan to cart', quote);
                addShippingProtection();
            },
            onDisable: function (quote) {
                console.log('call back to remove sp plan from cart', quote);
                removeShippingProtection()
            },
            onUpdate: function (quote) {
                console.log('call back to update sp plan from cart', quote);
                window.location.reload();
            }
        });
    }
}

/**
 * Init cart shipping protection
 */
function initCartOffers() {

    initExtend();

    if (window.EXT_IS_CONTRACTS_API) {
        return;
    }

    getAndProcessExtendShippingProtectionConfig();

    var createShippingQuotes = window.EXT_CREATE_SP_QUOTES;

    if (createShippingQuotes) {
        $.ajax({
            url: createShippingQuotes,
            method: 'POST',
            success: function (data) {
                var shippingOffersItem = data.cartItems;

                var attachBehavior = data.attachBehavior;

                var isShippingProtectionInCart;
                var isExtendShippingProtectionAdded = data.isExtendShippingProtectionAdded;
                var isExtendShippingProtectionRemoved = data.isExtendShippingProtectionRemoved;

                if (attachBehavior === 'OPT_IN' && !isExtendShippingProtectionAdded && !isExtendShippingProtectionRemoved) {
                    isShippingProtectionInCart = true;
                    addShippingProtection();
                } else {
                    isShippingProtectionInCart = false;
                }

                isShippingProtectionInCart = isExtendShippingProtectionAdded || isShippingProtectionInCart;

                renderOrUpdateSP(shippingOffersItem, isShippingProtectionInCart);
            },
            error: function () {}
        });
    }
}

module.exports = {
    initCartOffers: initCartOffers
};