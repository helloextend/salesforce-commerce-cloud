/* eslint-disable no-use-before-define */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-concat */
/* eslint-disable valid-jsdoc */
'use strict';

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
 * Show the page action
 * @returns {string} page action
 */
function getPageAction() {
    var $div = $('body').find('.js-page');
    var classes = $div.attr('class');
    var arrayOfClasses = classes.split(' ');
    var actionClass = arrayOfClasses[arrayOfClasses.length - 1];

    if (actionClass.includes('cart')) {
        return 'cart';
    }
    return 'checkout';
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
        $.ajax({
            url: removeShippingProtectionUrl,
            type: 'get',
            dataType: 'json',
            success: function () {
                window.location.reload();
            },
            error: function () {
                console.log('Error occurred: Shipping protection has not been deleted');
                window.location.reload();
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
        $.ajax({
            url: addShippingProtectionUrl,
            method: 'POST',
            success: function () {
                window.location.reload();
            },
            error: function () {
                console.log('Error occurred: Shipping protection has not been added to the card');
                window.location.reload();
            }
        });
    }
}

/**
 * Update Shipping Protection Value
 */
function updateShippingProtection() {
    var updateShippingProtectionUrl = window.EXT_SP_UPDATE;

    if (updateShippingProtectionUrl) {
        $.ajax({
            url: updateShippingProtectionUrl,
            method: 'POST',
            success: function () {},
            error: function () {
                console.log('Error occurred: Shipping protection has not been updated');
                window.location.reload();
            }
        });
    }
}

/**
 * Render the Shipping Protection iframe
 */
function renderOrUpdateSP(shippingOffersItem, isShippingProtectionInCart) {
    if (!Extend.shippingProtection) {
        return;
    }

    if (Extend.shippingProtection._instance !== null) {
        Extend.shippingProtection.update({
            items: shippingOffersItem
        });
    } else {
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
                removeShippingProtection();
            },
            onUpdate: function (quote) {
                console.log('call back to update sp plan in cart', quote);
            }
        });
    }
}

/**
 * Init cart shipping protection
 */
function initCartOffers() {
    if (window.EXT_IS_CONTRACTS_API) {
        return;
    }

    var EXT_SHIPPING_SWITCH = window.EXT_SHIPPING_SWITCH;

    var pageAction = getPageAction();

    // Determine whether ESP widget should display
    var isESPwidget = pageAction === EXT_SHIPPING_SWITCH;

    if (!isESPwidget) {
        return;
    }

    initExtend();

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
                var isExtendShippingProtectionAttend = data.isExtendShippingProtectionAttend;
                var isExtendShippingProtectionAdded = data.isExtendShippingProtectionAdded;
                var isExtendShippingProtectionRemoved = data.isExtendShippingProtectionRemoved;

                if (attachBehavior === 'OPT_OUT' && !isExtendShippingProtectionAttend && !isExtendShippingProtectionRemoved) {
                    isShippingProtectionInCart = true;
                    addShippingProtection();
                } else if (isExtendShippingProtectionAdded) {
                    isShippingProtectionInCart = true;
                } else if (isExtendShippingProtectionRemoved) {
                    isShippingProtectionInCart = false;
                } else {
                    isShippingProtectionInCart = false;
                }

                renderOrUpdateSP(shippingOffersItem, isShippingProtectionInCart);
            },
            error: function () {}
        });
    }
}

$(document).ready(function () {
    initCartOffers();
    $('body').on('click', '#update-cart', function () {
        updateShippingProtection();
    });
});
