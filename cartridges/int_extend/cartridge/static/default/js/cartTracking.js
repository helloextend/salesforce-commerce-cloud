'use strict';

var Extend = window.Extend || undefined;

function trackCartCheckout() {
    if (!Extend) {
        return;
    }

    var productAmount = $('.order-detail-summary').find('.order-total').find('.order-value').html();

    productAmount = productAmount.slice(1);
    productAmount = productAmount.replace(',', '');

    Extend.trackCartCheckout({
        cartTotal: +productAmount
    });
}

function extendInit() {
    var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
    var EXT_ENVIRONMENT = window.EXT_ENVIRONMENT || undefined;
    if (!EXT_STORE_ID) {
        console.log('Extend: storeId missing from storefront.');
        return;
    }

    Extend.config({ storeId: EXT_STORE_ID, environment: EXT_ENVIRONMENT });
}

$(document).ready(function () {
    extendInit();
    trackCartCheckout();
});

