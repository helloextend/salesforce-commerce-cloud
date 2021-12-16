'use strict';

var Extend = window.Extend || undefined;

module.exports = {
    trackCartCheckout: function () {
        $(document).ready(function () {
            if (!Extend) {
                return;
            }

            var productAmount = $('.order-total-summary').find('.sub-total').html();

            productAmount = productAmount.slice(1);
            productAmount = productAmount.replace(',', '');

            Extend.trackCartCheckout({
                cartTotal: +productAmount
            });
        });
    }
};
