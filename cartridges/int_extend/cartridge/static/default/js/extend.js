/* eslint-disable no-console */
'use strict';

function extendInit() {
    var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
    var EXT_ENVIRONMENT = window.EXT_ENVIRONMENT || undefined;
    if (!EXT_STORE_ID) {
        console.log('Extend: storeId missing from storefront.');
        return;
    }

    Extend.config({ storeId: EXT_STORE_ID, environment: EXT_ENVIRONMENT });

    disableLinkForExtendInMiniCart();
}

function disableLinkForExtendInMiniCart() {
    $('.mini-cart-product a[data-is-extend-product="true"]').attr('href', "#");
    $('body').on('click', '.mini-cart-product a[data-is-extend-product="true"]', function (e) {
        e.preventDefault();
    });
}

function extendPDP() {
    if ($('#extend-offer').length) {
        var Extend = window.Extend || undefined;
        if (Extend) {
            var productId = $('.product-add-to-cart input[name="pid"]').val();
            var extendComponent = Extend.buttons.instance('#extend-offer');
            if (extendComponent) {
                extendComponent.setActiveProduct(productId);
            } else {
                Extend.buttons.render('#extend-offer', {
                    referenceId: productId
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
        addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
        $('.extend-form-data').remove();
    } else if (EXT_PDP_UPSELL_SWITCH) {
        trackOfferViewedModal(form.find('input[name="pid"]').val(), 'product_modal');
        window.Extend.modal.open({
            referenceId: $('.product-number span').text().trim(),
            onClose: function (plan) {
                if (plan) {
                    form.append('<input type="hidden" name="extendPlanId" value="' + plan.planId + '" />');
                    form.append('<input type="hidden" name="extendPrice" value="' + plan.price + '" />');
                    form.append('<input type="hidden" name="extendTerm" value="' + plan.term + '" />');
                    form.append('<input class="extend-form-data" type="hidden" name="eventArea" value="product_modal" />');
                    form.append('<input class="extend-form-data" type="hidden" name="eventType" value="modal" />');
                }
                addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
                $('.extend-form-data').remove();
            }
        });
    }
}

function upsellModal(uuid) {
    $('body').on('click', '[data-pliuuid=' + uuid + '].extend-upsell-btn', function (e) {
        e.preventDefault();

        var form = {
            pid: $(this).data('pid'),
            quantity: $(this).parents('.cart-row').children('.item-quantity').find('.input-text').val(),
            options: [],
            pliUUID: $(this).data('pliuuid')
        };

        window.Extend.modal.open({
            referenceId: $(this).data('pid'),
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

function addExtendUpsellBtn(uuid, pid, qty) {
    $('#cart-table [data-uuid="' + uuid + '"].cart-row .item-details')
        .append('<div class="extend-upsell-style" id="extend-offer-' + uuid + '" data-pid=' + pid + '></div>')
        .ready(function () {
            /** initialize offer */
            Extend.buttons.renderSimpleOffer('#extend-offer-' + uuid, {
                referenceId: pid,
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

function renderUpsellBtns() {
    $('#cart-table .cart-row').each(function (index, product) {
        var uuid = $(product).attr('data-uuid') || undefined;

        $.ajax({
            url: window.EXT_CART_UPSELL + '?uuid=' + uuid,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                if (data.isEligible) {
                    addExtendUpsellBtn(uuid, data.pid, data.qty);
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
