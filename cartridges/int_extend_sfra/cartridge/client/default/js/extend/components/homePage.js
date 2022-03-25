/* eslint-disable no-unused-vars */
'use strict';

/**
 *
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

// function leadOfferModal(Extend, form, leadToken, addToCartUrl) {
//     Extend.aftermarketModal.open({
//         leadToken: leadToken,
//         onClose: function (plan) {
//             if (plan) {
//                 form.extendPlanId = plan.planId;
//                 form.extendPrice = plan.price;
//                 form.extendTerm = plan.term;
//             }
//         }
//     });
// }

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

module.exports = {
    modalOpen: function () {
        $(document).ready(function () {
            var Extend = window.Extend || undefined;

            if (!Extend) {
                return;
            }

            extendInit(Extend);
            var queryParameters = window.location.search.substring(1).split('&');
            var isLeadToken = isLeadTokenInURL(queryParameters);
            var leadToken;
        
            if (isLeadToken) {
                leadToken = getLeadToken(queryParameters);

                var pid = 'product';
                var addToCartUrl = $('body').find('input[name=lead-offer-modal-url]').val();

                var form = {
                    pid: pid,
                    quantity: 1
                };
        
                Extend.aftermarketModal.open({
                    leadToken: leadToken,
                    onClose: function (plan) {
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
                                    handlePostCartAdd(data);
                                    $.spinner().stop();
                                },
                                error: function () {
                                    $.spinner().stop();
                                }
                            });
                        }
                    }
                });
            }
        });
    }
};

