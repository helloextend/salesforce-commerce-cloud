/* eslint-disable newline-per-chained-call */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */
/* eslint-disable no-console */
'use strict';

/**
 * Tracking adding offers to cart via cart/minicart
 */
function trackOfferAddedToCart(data) {
    window.Extend.trackOfferAddedToCart({
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

function extendInit() {
    var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
    var EXT_ENVIRONMENT = window.EXT_ENVIRONMENT || undefined;
    if (!EXT_STORE_ID) {
        console.log('Extend: storeId missing from storefront.');
        return;
    }

    window.Extend.config({ storeId: EXT_STORE_ID, environment: EXT_ENVIRONMENT });

    disableLinkForExtendInMiniCart();
}

function disableLinkForExtendInMiniCart() {
    $('.mini-cart-product a[data-is-extend-product="true"]').attr('href', '#');
    $('body').on('click', '.mini-cart-product a[data-is-extend-product="true"]', function (e) {
        e.preventDefault();
    });
}

function extendPDP() {
    if ($('#extend-offer').length) {
        var Extend = window.Extend || undefined;
        if (Extend) {
            var productId = $('.product-add-to-cart input[name="pid"]').val();
            const price = parseInt($('#extend-offer').data('price')) * 100;
            const category = $('#extend-offer').data('category');
            var extendComponent = window.Extend.buttons.instance('#extend-offer');
            if (extendComponent) {
                extendComponent.setActiveProduct({
                    referenceId: productId,
                    price: price,
                    category: category
                });
            } else {
                window.Extend.buttons.render('#extend-offer', {
                    referenceId: productId,
                    price: price,
                    category: category
                });
            }
        }
    }
}

function addItemToCartHandler(form, page, minicart, dialog, addItemToCart) {
    if (window.EXT_A_EXT_GLOBAL_SWITCH) {
        var payload = createAddToCartAnalytics(form);
        trackAddToCart(payload);
    }
    addItemToCart(form).then(function (response) {
        var $uuid = form.find('input[name="uuid"]');
        if ($uuid.length > 0 && $uuid.val().length > 0) {
            page.refresh();
        } else {
            // do not close quickview if adding individual item that is part of product set
            if (!$(this).hasClass('sub-product-item')) {
                dialog.close();
            }
            minicart.show(response);
        }
    }.bind(this));
}

function extendAddToCart(form, page, minicart, dialog, addItemToCart) {
    var EXT_PDP_UPSELL_SWITCH = window.EXT_PDP_UPSELL_SWITCH || undefined;
    var isPlanSelected = false;

    if ($('#extend-offer').length) {
        var extendComponent = window.Extend.buttons.instance('#extend-offer');

        if (!extendComponent) {
            addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
            return;
        }

        var extendPlan = extendComponent.getPlanSelection();

        if (extendPlan) {
            form.append('<input class="extend-form-data" type="hidden" name="extendPlanId" value="' + extendPlan.planId + '" />');
            form.append('<input class="extend-form-data" type="hidden" name="extendPrice" value="' + extendPlan.price + '" />');
            form.append('<input class="extend-form-data" type="hidden" name="extendTerm" value="' + extendPlan.term + '" />');
            form.append('<input class="extend-form-data" type="hidden" name="eventArea" value="product_page" />');
            form.append('<input class="extend-form-data" type="hidden" name="eventType" value="buttons" />');
            isPlanSelected = true;
            addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
            $('.extend-form-data').remove();
        }
    } if (EXT_PDP_UPSELL_SWITCH && !isPlanSelected && $('#extend-offer').find('iframe').length) {
        var price = parseInt($('#extend-offer').data('price')) * 100;
        var category = $('#extend-offer').data('category');
        window.Extend.modal.open({
            referenceId: $('.product-number span').text().trim(),
            price: price,
            category: category,
            onClose: function (plan) {
                if (plan) {
                    form.append('<input type="hidden" name="extendPlanId" value="' + plan.planId + '" />');
                    form.append('<input type="hidden" name="extendPrice" value="' + plan.price + '" />');
                    form.append('<input type="hidden" name="extendTerm" value="' + plan.term + '" />');
                    form.append('<input class="extend-form-data" type="hidden" name="eventArea" value="product_modal" />');
                    form.append('<input class="extend-form-data" type="hidden" name="eventType" value="modal" />');
                    isPlanSelected = true;
                }
                addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
                $('.extend-form-data').remove();
            }
        });
    } else if (!isPlanSelected) {
        addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
        return;
    }
}

function upsellModal(uuid) {
    $('body').on('click', '[data-pliuuid=' + uuid + '].extend-upsell-btn', function (e) {
        e.preventDefault();

        const price = parseInt($(this).data('price')) * 100;

        var form = {
            pid: $(this).data('pid'),
            quantity: $(this).parents('.cart-row').children('.item-quantity').find('.input-text').val(),
            options: [],
            pliUUID: $(this).data('pliuuid'),
            category: $(this).data('category'),
            price: price,
        };


        window.Extend.modal.open({
            referenceId: $(this).data('pid'),
            price: price,
            category: category,
        
            onClose: function (plan) {
                if (plan) {
                    form.extendPlanId = plan.planId;
                    form.extendPrice = plan.price;
                    form.extendTerm = plan.term;

                    $.ajax({
                        url: window.EXT_CART_ADDTOCART,
                        method: 'POST',
                        data: form,
                        success: function () {
                            location.reload();
                        },
                        error: function () {
                        }
                    });
                }
            }
        });
    });
}

function addExtendUpsellBtn(uuid, product) {
    var isRenderButton = $('.footer-container').find('input[name=noRenderExtendButton]').length;
    var pid = product.pid;
    var qty = product.qty;
    var category = product.category;
    var price = product.price * 100;

    $('#cart-table [data-uuid="' + uuid + '"].cart-row .item-details')
        .append('<div class="extend-upsell-style" id="extend-offer-' + uuid + '" data-pid=' + pid + '></div>')
        .ready(function () {
            if (!isRenderButton) {
                 /** initialize offer */
                window.Extend.buttons.renderSimpleOffer('#extend-offer-' + uuid, {
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
                                form.pliUUID = uuid;
                                form.quantity = qty;
                                form.category = category;
                                form.price = price;
                                trackOfferAddedToCart(form);
                                $.ajax({
                                    url: window.EXT_CART_ADDTOCART,
                                    method: 'POST',
                                    data: form,
                                    success: function () {
                                        location.reload();
                                    },
                                    error: function () {
                                    }
                                });
                            }
                        }
                });
            }
        });
}

function renderUpsellBtns() {
    $('#cart-table .cart-row').each(function (index, product) {
        var uuid = $(product).attr('data-uuid') || undefined;

        $.ajax({
            url: window.EXT_CART_UPSELL + '?uuid=' + uuid,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                if (data.isEligible && window.EXT_CART_UPSELL_SWITCH) {
                    addExtendUpsellBtn(uuid, data);
                }
            },
            error: function () { }
        });
    });
}


$(document).ready(function () {
    extendInit();
    extendPDP();
    if ($('.pt_cart').length) { renderUpsellBtns(); }
});
