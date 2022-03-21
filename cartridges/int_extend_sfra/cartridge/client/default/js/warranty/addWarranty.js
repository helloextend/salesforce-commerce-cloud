/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
'use strict';
var base = require('../product/base');
var productDetail = require('../product/detail');
var Extend = window.Extend || undefined;

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'alert-danger' : 'alert-success';
    // show add to cart toast
    if ($('.add-to-cart-messages').length === 0) {
        $('body').append(
            '<div class="add-to-cart-messages"></div>'
        );
    }

    $('.add-to-cart-messages').append(
        '<div class="alert ' + messageType + ' add-to-basket-alert text-center" role="alert">'
        + response.message
        + '</div>'
    );

    setTimeout(function () {
        $('.add-to-basket-alert').remove();
    }, 5000);
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Create hidden input in case whether only warranty was added to cart
 * @param {Object} data - ajax response after adding warranty to cart
 */
function createHiddenInput(data) {
    var $footer = $('#footercontent');
    if (!data.renderExtendButton) {
        var $input = $('input').attr({
            type: 'hidden',
            name: 'noRenderExtendButton'
        });
        $footer.append($input);
    }
}

/**
 * Open modal window with warranty's offer
 * @param {Object} form - info about product
 * @param {string} addToCartUrl - add to cart url
 */
function warrantyModalOpen(form, addToCartUrl) {
    $('body').trigger('extend:modal:viewed', {
        productId: form.pid, area: 'product_modal'
    });
    Extend.modal.open({
        referenceId: $('.product-detail').data('pid'),
        onClose: function (plan) {
            var parentId = $('.product-id').text();
            if (plan) {
                form.parentId = parentId;
                form.pid = 'EXTEND-' + plan.term;
                form.extendPlanId = plan.planId;
                form.extendPrice = plan.price;
                form.extendTerm = plan.term;
                form.area = 'product_modal';
                form.component = 'modal';
                $(this).trigger('updateAddToCartFormData', form);
            }

            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        handlePostCartAdd(data);
                        createHiddenInput(data);
                        // $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                        base.miniCartReportingUrl(data.reportingURL);
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        }
    });
}

module.exports = {
    extendInit: productDetail.extendInit,
    addWarranty: function () {
        var pid = null;
        var addToCartUrl = null;
        var pidsObj = null;

        pid = base.getPidValue('button.add-to-cart');
        addToCartUrl = $('.product-detail').find('input[name=addWarranty]').val();

        var form = {
            pid: pid,
            pidsObj: pidsObj,
            childProducts: getChildProducts(),
            quantity: base.getQuantitySelected($('.js-quantity-select'))
        };

        var EXT_PDP_UPSELL_SWITCH = window.EXT_PDP_UPSELL_SWITCH || undefined;
        if (EXT_PDP_UPSELL_SWITCH) {
            warrantyModalOpen(form, addToCartUrl);
        }
    }
};
