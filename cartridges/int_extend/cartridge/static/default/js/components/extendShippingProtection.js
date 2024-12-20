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
        window.Extend.config({ storeId: EXT_STORE_ID, environment: EXT_ENVIRONMENT });
    });
}

/**
 * Store the shipping information to the sessionStorage
 */
function saveShippingInfo() {
    var shippingInfo = {
        firstName: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_firstName"]').val(),
        lastName: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_lastName"]').val(),
        address1: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_address1"]').val(),
        address2: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_address2"]').val(),
        city: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_city"]').val(),
        zipCode: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_postal"]').val(),
        country: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_country"]').val(),
        phoneNumber: $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_phone"]').val()
    }
    sessionStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
}

/**
 * Load the shipping information from the sessionStorage
 */
function loadShippingInfo() {
    var shippingInfo = sessionStorage.getItem('shippingInfo');
    if (shippingInfo) {
        shippingInfo = JSON.parse(shippingInfo);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_firstName"]').val(shippingInfo.firstName);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_lastName"]').val(shippingInfo.lastName);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_address1"]').val(shippingInfo.address1);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_address2"]').val(shippingInfo.address2);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_city"]').val(shippingInfo.city);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_postal"]').val(shippingInfo.zipCode);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_country"]').val(shippingInfo.country);
        $('input[name$="dwfrm_singleshipping_shippingAddress_addressFields_phone"]').val(shippingInfo.phoneNumber);
    }
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
        var pageAction = getPageAction();
        Extend.shippingProtection.render({
            selector: '#extend-shipping-offer',
            items: shippingOffersItem,
            isShippingProtectionInCart: isShippingProtectionInCart,
            onEnable: function (quote) {
                console.log('call back to add SP plan to cart', quote);
                if (pageAction === 'checkout') {
                    saveShippingInfo();
                }
                addShippingProtection();
            },
            onDisable: function (quote) {
                console.log('call back to remove sp plan from cart', quote);
                if (pageAction === 'checkout') {
                    saveShippingInfo();
                }
                removeShippingProtection();
            },
            onUpdate: function (quote) {
                saveShippingInfo();
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

    if (pageAction === 'checkout') {
        loadShippingInfo();
    }

    getAndProcessExtendShippingProtectionConfig();

    var createShippingQuotes = window.EXT_CREATE_SP_QUOTES;

    if (createShippingQuotes) {
        $.ajax({
            url: createShippingQuotes,
            method: 'POST',
            success: function (data) {
                var shippingOffersItem = data.cartItems;

                if (!shippingOffersItem.length) {
                    return;
                }

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
