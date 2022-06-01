/* eslint-disable no-unused-vars */
'use strict';

/**
 * @param {Object} Extend global Extend object
 * @returns returns in case whether any storeID founded
 */
function extendInit(Extend) {
    var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
    var EXT_ENVIRONMENT = window.EXT_ENVIRONMENT || undefined;
    if (!EXT_STORE_ID) {
        console.log('Extend: storeId missing from storefront.');
        return;
    }

    Extend.config({ storeId: EXT_STORE_ID, environment: EXT_ENVIRONMENT });
}

/**
 *
 * @param {string} params - url parameters
 * @returns {string} - leadToken value
 */
function getLeadToken(params) {
    var leadToken;

    for (var i = 0; i < params.length; i++) {
        if (params[i].includes('leadToken')) {
            leadToken = params[i].split('=')[1];
        }
    }
    return leadToken;
}

/**
 *
 * @param {string} params - url parameters
 * @returns {boolean} true in case whether leadToken in url, fasle othewise
 */
function isLeadTokenInURL(params) {
    for (var i = 0; i < params.length; i++) {
        if (params[i].includes('leadToken')) {
            return true;
        }
    }
    return false;
}

/**
 * Get info about the product
 * @param {document} $extendIframe extend modal iframe
 * @returns {Object} information about product to add
 */
function getProductInfo($extendIframe) {
    var $productContainer = $extendIframe.contents().find('.offers-product-container');
    var $productInfo = $productContainer.find('.product-text-section');

    var productName = $productInfo.find('.product-info').first().text();
    var quantity = $productInfo.find('.product-info').last().text();

    var product = {
        productName: productName,
        quantity: quantity
    };

    return product;
}

/**
 * Create hidden input in case whether only warranty was added to cart
 * @param {Object} data - ajax response after adding warranty to cart
 */
function renderExtendButton(data) {
    var $footer = $('.footer-container');
    if (!data.renderExtendButton) {
        var $input = $('input').attr({
            type: 'hidden',
            name: 'noRenderExtendButton'
        });
        $footer.append($input);
    }
}

/**
 * Open lead offer modal window to choose an extension
 */
function leadOfferModalOpen() {
    $(document).ready(function () {
        var Extend = window.Extend || undefined;

        if (!Extend) {
            return;
        }

        extendInit(Extend);

        var queryParameters = window.location.search.substring(1).split('&');
        var isLeadToken = isLeadTokenInURL(queryParameters);

        if (isLeadToken) {
            var leadToken;
            leadToken = getLeadToken(queryParameters);

            var addToCartUrl = $('body').find('input[name=lead-offer-modal-url]').val();
            var continueUrl = $('body').find('input[name=continue-cart-url]').val();

            Extend.aftermarketModal.open({
                leadToken: leadToken,
                onClose: function (plan) {
                    var $extendIframe = $('#extend-offers-modal-iframe');
                    var productInfo = getProductInfo($extendIframe);
                    var form = {
                        leadToken: leadToken,
                        productName: productInfo.productName,
                        quantity: +productInfo.quantity || 1
                    };

                    if (plan) {
                        form.extendPlanId = plan.planId;
                        form.extendPrice = plan.price;
                        form.extendTerm = plan.term;
                    }

                    if (addToCartUrl) {
                        $.ajax({
                            url: addToCartUrl,
                            method: 'POST',
                            data: form,
                            success: function (data) {
                                renderExtendButton(data);
                                setTimeout(function () {
                                    location.href = continueUrl;
                                }, 1000);
                            }
                        });
                    }
                }
            });
        }
    });
}

$(document).ready( function () {
    setTimeout(leadOfferModalOpen, 1000);
});
