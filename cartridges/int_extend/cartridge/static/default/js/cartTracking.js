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

$(document).ready(function () {
    trackCartCheckout();
});

