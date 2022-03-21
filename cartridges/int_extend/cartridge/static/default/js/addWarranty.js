/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable one-var */
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

function addItemToCartHandler(form, addItemToCart) {
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
    window.Extend.modal.open({
        referenceId: $('.product-number span').text().trim(),
        onClose: function (plan) {
            var parentId = $('div.product-number').find('span').text();
            if (plan) {
                form.append('<input type="hidden" name="extendParentId" value="' + parentId + '" />');
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

/**
 * Create hidden input in case whether only warranty was added to cart
 * @param {string} name - data attribute called name
 * @param {string} value - data attribute called value
 */
function createHiddenInput(name, value) {
    var $extendIframe = $('iframe#extend-offers-modal-iframe');
    var $input = $('input').attr({
        type: 'hidden',
        name: `${name}`,
        value: `${value}`
    });
    $extendIframe.append($input);
}

/**
 * @description Make the AJAX request to add an item to cart
 * @param {Element} form The form element that contains the item quantity and ID data
 * @returns {Promise}
 */
var addItemToCart = function (form) {
    var $form = $(form);
    var $extendIframe = $('iframe#extend-offers-modal-iframe');

    var addToCartUrl = $extendIframe.closest('body').find('input[name=addWarranty]').val();
    var continueCartUrl = $extendIframe.closest('body').find('input[name=continueCartUrl]').val();

    return Promise.resolve($.ajax({
        type: 'POST',
        url: addToCartUrl,
        data: $form.serialize()
    })).then(function (response) {
// handle error in the response
        if (response.error) {
            throw new Error(response.error);
        } else {
            location.href = continueCartUrl;
        }
    });
};

var addWarranty = function () {
    var divAddToCart = $('div.product-add-to-cart');
    var $form = divAddToCart.closest('form');

    var page, minicart, dialog;

    warrantyModalOpen($form, page, minicart, dialog, addItemToCart);
};

$(document).ready(function () {
    extendInit();
    addWarranty();
});
