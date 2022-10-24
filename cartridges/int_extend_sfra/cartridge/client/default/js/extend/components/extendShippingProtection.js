/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-concat */
/* eslint-disable valid-jsdoc */
'use strict';

const { data } = require("jquery");

var Extend = window.Extend || undefined;

var ESPinCart = '.js-extendShippingProtectionInCart';
var NoESPinCart = '.js-noExtendShippingProtectionInCart';

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
 * Check does shipping offer exists in cart
 * @returns isShippingProtectionInCart
 */
function doesShippingOfferExists() {
    var url = window.EXT_CART_SP_CHECK;
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            var isShippingProtectionInCart = data.isShippingProtectionInCart;
            addESPclassName(isShippingProtectionInCart);
        },
        error: function () {}
    });
}

/**
 * Add class to $footer depends on ESP availibility in the cart
 */
function addESPclassName(isShippingProtectionInCart) {
    var $footer = $('#footercontent');

    if (isShippingProtectionInCart) {
        $footer.addClass(ESPinCart);
    } else {
        $footer.addClass(NoESPinCart);
    }
}

/**
 * Check the SP availibility
 * @returns isExtendShippingInCart
 */
function checkTheShippingAvailibility() {
    var isExtendShippingInCart = false;

    var $footer = $('#footercontent');

    if ($footer.hasClass(ESPinCart)) {
        isExtendShippingInCart = true;
    } else if ($footer.hasClass(NoESPinCart)) {
        isExtendShippingInCart = false;
    }

    return isExtendShippingInCart;
}

/**
 * Change the class depending on ESP availibility
 * @param {Boolean} isShippingProtection - boolean value
 */
function changeClassName(isShippingProtection) {
    var $footer = $('#footercontent');
    if (!isShippingProtection) {
        $footer.removeClass(ESPinCart).addClass(NoESPinCart);
    } else {
        $footer.removeClass(NoESPinCart).addClass(ESPinCart);
    }
}

/**
 * Remove Shipping Protection From The Cart
 */
function removeShippingProtection() {
    var removeShippingProtectionUrl = window.EXT_SP_REMOVEFROMCART;

    var isShippingProtectionInCart = checkTheShippingAvailibility();

    if (isShippingProtectionInCart) {

        var isShippingProtection = false;
        $.spinner().start();

        $.ajax({
            url: removeShippingProtectionUrl,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('body').trigger('cart:update', data);
                changeClassName(isShippingProtection);
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

    var isShippingProtectionInCart = checkTheShippingAvailibility();

    if (!isShippingProtectionInCart) {

        var isShippingProtection = true;
        $.spinner().start();

        $.ajax({
            url: addShippingProtectionUrl,
            method: 'POST',
            success: function (data) {
                $('body').trigger('cart:update', data);
                changeClassName(isShippingProtection)
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

    doesShippingOfferExists();

    var createShippingQuotes = window.EXT_CREATE_SP_QUOTES;

    if (createShippingQuotes) {
        $.ajax({
            url: createShippingQuotes,
            method: 'POST',
            success: function (data) {
                var shippingOffersItem = data.cartItems;

                var isShippingProtectionInCart = checkTheShippingAvailibility();

                renderOrUpdateSP(shippingOffersItem, isShippingProtectionInCart);
            },
            error: function () {}
        });
    }
}

module.exports = {
    initCartOffers: initCartOffers
};