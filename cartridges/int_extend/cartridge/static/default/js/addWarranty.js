/* eslint-disable no-use-before-define */
/* eslint-disable require-jsdoc */
'use strict';

var Extend = window.Extend || undefined;

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
    $('.mini-cart-product a[data-is-extend-product="true"]').attr('href', '#');
    $('body').on('click', '.mini-cart-product a[data-is-extend-product="true"]', function (e) {
        e.preventDefault();
    });
}

function addItemToCartHandler(form, page, minicart, dialog, addItemToCart) {
    if (window.EXT_A_EXT_GLOBAL_SWITCH) {
        var payload = createAddToCartAnalytics(form);
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

function warrantyModalOpen(form, page, minicart, dialog, addItemToCart) {
    var EXT_PDP_UPSELL_SWITCH = window.EXT_PDP_UPSELL_SWITCH || undefined;
    var isPlanSelected = false;

    if ($('#extend-offer').length) {
        var extendComponent = window.Extend.buttons.instance('#extend-offer');

        if (!extendComponent) {
            addItemToCartHandler(form, page, minicart, dialog, addItemToCart);
            return;
        }
    }

    if (EXT_PDP_UPSELL_SWITCH && !isPlanSelected && $('#extend-offer').find('iframe').length) {
        window.Extend.modal.open({
            referenceId: $('.product-number span').text().trim(),
            onClose: function (plan) {
                $('.extend-form-data').remove();
            }
        });
    }
    
    // window.Extend.modal.open({
    //     referenceId: $('.product-number span').text().trim(),
    //     onClose: function (plan) {
    //         $('.extend-form-data').remove();
    //     }
    // });
}

// function addWarranty() {

// }

$(document).ready(function () {
    extendInit();

    var $form = $('button#add-to-cart');
    var addItemToCart = function (form) {
        var $form = $(form),
            $qty = $form.find('input[name="Quantity"]');
        if ($qty.length === 0 || isNaN($qty.val()) || parseInt($qty.val(), 10) === 0) {
            $qty.val('1');
        }
        return Promise.resolve($.ajax({
            type: 'POST',
            url: util.ajaxUrl(Urls.addProduct),
            data: $form.serialize()
        })).then(function (response) {
            // handle error in the response
            if (response.error) {
                throw new Error(response.error);
            } else {
                return response;
            }
        });
    };
    warrantyModalOpen($form, page, minicart, dialog, addItemToCart);
    // extendPDP();
    // if ($('.pt_cart').length) { renderUpsellBtns(); }
    // extendAddToCart($form, page, minicart, dialog, addItemToCart);
});
