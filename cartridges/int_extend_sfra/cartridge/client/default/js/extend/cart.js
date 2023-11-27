/* eslint-disable no-underscore-dangle */
/* eslint-disable no-useless-concat */
/* eslint-disable valid-jsdoc */
'use strict';

const { data } = require("jquery");

var Extend = window.Extend || undefined;

/**
 * Tracking adding offers to cart via cart/minicart
 */
function trackOfferAddedToCart(data) {
    Extend.trackOfferAddedToCart({
        productId: data.pid,
        productQuantity: data.quantity,
        warrantyQuantity: data.quantity,
        planId: data.extendPlanId,
        offerType: {
            area: 'cart_page',
            component: 'modal'
        }
    });
}

/**
 * Renders an Extend upsell button in cart page
 * @param {string} uuid - line item uuid
 * @param {string} pid - corresponding product id
 * @param {string} qty- corresponding quantity
 * @returns
 */
function addExtendUpsellBtnCart(uuid, product) {
    var pid = product.pid;
    var qty = product.qty;
    var price = product.price * 100;
    var category = product.category; 
    var hasExtendUpsell = $('.item-' + uuid).parents('.product-card-footer').find('#extend-offer-' + uuid).length > 0;
    var isRenderButton = $('#footercontent').find('input[name=noRenderExtendButton]').length;
    if (!hasExtendUpsell && !isRenderButton) {
        $('<div class="extend-upsell-style" id="extend-offer-' + uuid + '" data-pid=' + pid + '></div>')
            .insertAfter('.item-' + uuid)
            .ready(function () {
                /** initialize offer */
                Extend.buttons.renderSimpleOffer('#extend-offer-' + uuid, {
                    referenceId: pid,
                    price: price,
                    category: category,
                    onAddToCart:
                        function (plan) {
                            if (plan) {
                                var form = {};
                                form.extendPlanId = plan.plan.planId;
                                form.extendPrice = plan.plan.price;
                                form.extendTerm = plan.plan.term;
                                form.pid = pid;
                                form.price = price;
                                form.category = category;
                                form.pliUUID = uuid;
                                form.quantity = qty;
                                trackOfferAddedToCart(form);

                                $.spinner().start();

                                $.ajax({
                                    url: window.EXT_CART_ADDTOCART,
                                    method: 'POST',
                                    data: form,
                                    success: function () {
                                        location.reload();
                                    },
                                    error: function () {
                                        $.spinner().stop();
                                    }
                                });
                            }
                        }
                });
            });
    }
}

/**
 * Renders an Extend upsell button under Mini Cart popup
 * @param {string} uuid - line item uuid
 * @param {string} btnLabel - upsell button label
 * @param {string} pid - corresponding product id
 */
function addExtendUpsellBtnInMiniCart(uuid, product) {
    var pid = product.pid;
    var qty = product.qty;
    var price = product.price * 100;
    var category = product.category; 
    var hasExtendUpsell = $('.minicart').find('.card.uuid-' + uuid).find('#extend-offer-' + uuid).length > 0;
    var isRenderButton = $('#footercontent').find('input[name=noRenderButton]').length;
    var isShippingProtecting = pid === 'EXTEND-SHIPPING-PROTECTION' ? true : false;

    if (!hasExtendUpsell && !isRenderButton && !isShippingProtecting) {
        $('<div class="extend-upsell-style" id="extend-offer-' + uuid + '" data-pid=' + pid + '></div>')
            .insertAfter('.minicart .product-summary ' + '.item-' + uuid)
            .ready(function () {
                /** initialize offer */
                Extend.buttons.renderSimpleOffer('#extend-offer-' + uuid, {
                    referenceId: pid,
                    price: price,
                    category: category,
                    onAddToCart:
                        function (plan) {
                            if (plan) {
                                var form = {};
                                form.extendPlanId = plan.plan.planId;
                                form.extendPrice = plan.plan.price;
                                form.extendTerm = plan.plan.term;
                                form.pid = pid;
                                form.price = price;
                                form.category = category;
                                form.pliUUID = uuid;
                                form.quantity = qty;
                                trackOfferAddedToCart(form);

                                $.spinner().start();

                                $.ajax({
                                    url: window.EXT_CART_ADDTOCART,
                                    method: 'POST',
                                    data: form,
                                    success: function () {
                                        /** extend analytics integration */
                                        location.reload();
                                    },
                                    error: function () {
                                        $.spinner().stop();
                                    }
                                });
                            }
                        }
                });
            });
    }
}

/**
 * Produces the request for render upsell buttons
 */
function makeRequestForRender(uuid, renderUpsellBtnCallback) {
    $.ajax({
        url: window.EXT_CART_WARRANTYCHECK + '?uuid=' + uuid,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            if (data.isEligible) {
                renderUpsellBtnCallback(uuid, data);
            }
        },
        error: function () { }
    });
}

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
 * Render the upsell buttons
 */
function renderUpsellBtns() {
    if (!window.EXT_CART_UPSELL_SWITCH) {
        return;
    }

    $('.cart-page .card.product-info').each(function (index, product) {
        var classes = $(product).attr('class').match(/uuid-(\w+)/);
        var uuid;

        if (classes) {
            uuid = classes[1];
        }

        makeRequestForRender(uuid, addExtendUpsellBtnCart);
    });
}

/**
 * Render the upsell buttons on mini cart
 */
function renderUpsellBtnsMiniCart() {
    if (!window.EXT_CART_UPSELL_SWITCH) {
        return;
    }

    $('.minicart .product-summary .card').each(function (index, product) {
        var classes = $(product).attr('class').match(/uuid-(\w+)/);
        var uuid;

        if (classes) {
            uuid = classes[1];
        }

        makeRequestForRender(uuid, addExtendUpsellBtnInMiniCart);
    });
}

/**
 * Rerender the button after the warranty is deleted from cart
 */
function updateUpsellBtns() {
    $('body').on('click', '.cart-delete-confirmation-btn', function () {
        $('body').on('cart:update', function () {
            renderUpsellBtns();
        });
    });

    // Render when Mini Cart loaded
    $('body').on('extend:minicart:loaded', function () {
        renderUpsellBtnsMiniCart();
    });
}

module.exports = {
    initExtend: initExtend,
    renderUpsellBtns: renderUpsellBtns,
    updateUpsellBtns: updateUpsellBtns
};
