'use strict';

var ExtendAnalytics = window.ExtendAnalytics || undefined;

function trackOfferViewedPDP(productId) {
    ExtendAnalytics.trackOfferViewed({
        productId: productId,
        offerType: {
            area: 'product_page',
            component: 'buttons'
        }
    });
}

function trackOfferViewedModal(productId, area) {
    ExtendAnalytics.trackOfferViewed({
        productId: productId,
        offerType: {
            area: area,
            component: 'modal'
        }
    });
}

function trackAddToCart(data, area, component) {
    if (data.extendPlanId) {
        ExtendAnalytics.trackOfferAddedToCart({
            productId: data.pid,
            productQuantity: +data.quantity,
            planId: data.extendPlanId,
            offerType: {
                area: area,
                component: component
            }
        });
    } else {
        ExtendAnalytics.trackProductAddedToCart({
            productId: data.pid,
            productQuantity: +data.quantity
        });
    }
}


function trackOfferRemovedFromCart(data) {
    ExtendAnalytics.trackOfferRemovedFromCart({
        productId: data.referenceId,
        planId: data.planId
    });
}

function trackProductRemovedFromCart(data) {
    ExtendAnalytics.trackProductRemovedFromCart({
        productId: data.productId,
    });
}

function trackProductUpdated(data) {
    ExtendAnalytics.trackProductUpdated({
        productId: data.productId,
        updates: {
            productQuantity: +data.productQuantity
        },
    });
}

function trackOfferUpdated(data) {
    ExtendAnalytics.trackOfferUpdated({
        productId: data.productId,
        planId: data.planId,
        updates: {
            warrantyQuantity: +data.warrantyQuantity,
            productQuantity: +data.productQuantity,
        },
    });
}

function trackLinkClicked(data) {
    ExtendAnalytics.trackLinkClicked({
        linkEvent: data.linkEvent,
        productId: data.productId,
        linkType: {
            area: data.LinkTypeArea,
            component: data.LinkTypeComponent
        }
    });
}

function trackExtendPDP(currentTarget) {
    var productId;
    var extendComponent = Extend.buttons.instance('#extend-offer');

    if (extendComponent) {
        productId = extendComponent.getActiveProduct().id;
    } else {
        productId = $('.product-detail').data('pid');
    }
    trackOfferViewedPDP(productId)

    var addTrackEvent = function () {
        $(currentTarget).contents().find('.info-button').on('click', function () {
            var data = {
                linkEvent: 'learn_more_clicked',
                productId: productId,
                LinkTypeArea: 'product_page',
                LinkTypeComponent: 'learn_more_info_icon'
            }

            trackLinkClicked(data);
        });
        $(currentTarget).contents().find('.info-button').addClass('chained')
        if ($(currentTarget).contents().find('.info-button').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.info-button').removeClass('chained')
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

function addTrackEventUpsellCart(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.simple-offer').on('click', function () {
            var pid = $(currentTarget).parents('.extend-upsell-style').data().pid;
            window.extendModalReferenceId = pid;
            trackOfferViewedModal(pid, 'cart_page')
        });
        $(currentTarget).contents().find('.simple-offer').addClass('chained')
        if ($(currentTarget).contents().find('button').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.simple-offer').removeClass('chained')
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

function addTrackEventModal(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.link').on('click', function () {
            var productId;
            var area;
            var pdp = $('.product-detail');

            if (pdp.length) {
                productId = pdp.find('.product-id').html();
                area = 'offer_modal';
            } else {
                productId = window.extendModalReferenceId;
                area = 'simple_offer_modal';
            }

            var data = {
                linkEvent: 'plan_details_clicked',
                productId: productId,
                LinkTypeArea: area,
                LinkTypeComponent: 'see_plan_details_link'
            }

            trackLinkClicked(data);
        });

        $(currentTarget).contents().find('.link').addClass('chained')
        if ($(currentTarget).contents().find('.link').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.link').removeClass('chained')
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

function trackModalLinkClicked(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.terms-link').on('click', function () {
            var productId = $('.product-detail').find('.product-id').html();

            var data = {
                linkEvent: 'plan_details_clicked',
                productId: productId,
                LinkTypeArea: 'learn_more_modal',
                LinkTypeComponent: 'see_plan_details_link'
            }

            trackLinkClicked(data);
        });

        $(currentTarget).contents().find('.terms-link').addClass('chained')
        if ($(currentTarget).contents().find('.terms-link').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.terms-link').removeClass('chained')
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

module.exports = {
    methods: {
        trackOfferViewedModal: trackOfferViewedModal,
        trackAddToCart: trackAddToCart
    },

    initExtendAnalytics: function () {
        var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
        ExtendAnalytics.config({ storeId: EXT_STORE_ID });
    },

    trackExtendDOMNodeInserted: function () {
        $(document).on('DOMNodeInserted', 'body', function (e) {
            if (e.target.tagName && e.target.tagName.toLowerCase() !== 'iframe') {
                return;
            }
            var currentTarget = $(e.target);

            // trackOfferViewedPDPButtons and trackLinkClicked
            if ($(e.target).parents('#extend-offer').length) {
                trackExtendPDP(currentTarget);

                // trackOfferViewedModal and trackLinkClicked
            } else if ($(e.target).parents('.extend-upsell-style').length) {
                addTrackEventUpsellCart(currentTarget);

                // trackLinkClicked
            } else if (e.target.id === 'extend-offers-modal-iframe') {
                addTrackEventModal(currentTarget);

                // trackLinkClicked
            } else if (e.target.id === 'extend-learn-more-modal-iframe') {
                trackModalLinkClicked(currentTarget);
            }
        });
    },

    trackCartUpdate: function () {
        $('body').on('cart:update', function (e, data) {
            if (data.extendAnalytics) {
                var eventData = data.extendAnalytics;
                var event = data.extendAnalytics.event;

                if (event === 'productRemovedFromCart') {
                    trackProductRemovedFromCart(eventData);
                } else if (event === 'offerRemovedFromCart') {
                    trackOfferRemovedFromCart(eventData);
                } else if (event === 'productUpdated') {
                    trackProductUpdated(eventData);
                } else if (event === 'offerUpdated') {
                    trackOfferUpdated(eventData);
                }
            }
        });
    },

    trackCheckoutBtn: function () {
        $('body').on('click', '.checkout-btn', function () {
            var productAmmount = $('.minicart').find('.sub-total').html()
                || $('.cart').find('.sub-total').html();

            productAmmount = productAmmount.slice(1);
            productAmmount = productAmmount.replace(',', '');

            ExtendAnalytics.trackCartCheckout({
                cartTotal: +productAmmount
            });
        })
    },

};