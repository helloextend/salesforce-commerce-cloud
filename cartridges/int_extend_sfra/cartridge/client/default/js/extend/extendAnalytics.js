/* eslint-disable no-use-before-define */
/* eslint-disable no-undef */
/* eslint-disable require-jsdoc */
'use strict';

var Extend = window.Extend || undefined;

function trackOfferAddedToCart(data) {
    window.Extend.trackOfferAddedToCart({
        productId: data.productId,
        productQuantity: data.productQuantity,
        warrantyQuantity: data.productQuantity,
        planId: data.planId,
        offerType: {
            area: data.offerTypeArea,
            component: data.offerTypeComponent
        }
    });
}

function trackProductAddedToCart(data) {
    Extend.trackProductAddedToCart({
        productId: data.productId,
        productQuantity: data.productQuantity
    });
}

function trackOfferRemovedFromCart(data) {
    Extend.trackOfferRemovedFromCart({
        productId: data.referenceId,
        planId: data.planId
    });
}

function trackProductRemovedFromCart(data) {
    Extend.trackProductRemovedFromCart({
        productId: data.productId
    });
}

function trackProductUpdated(data) {
    Extend.trackProductUpdated({
        productId: data.productId,
        updates: {
            productQuantity: +data.productQuantity
        }
    });
}

function trackOfferUpdated(data) {
    Extend.trackOfferUpdated({
        productId: data.productId,
        planId: data.planId,
        updates: {
            warrantyQuantity: +data.productQuantity,
            productQuantity: +data.productQuantity
        }
    });
}

function trackLinkClicked(data) {
    Extend.trackLinkClicked({
        linkEvent: data.linkEvent,
        productId: data.productId,
        linkType: {
            area: data.LinkTypeArea,
            component: data.LinkTypeComponent
        }
    });
}

function addTrackEventUpsellCart(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.simple-offer').on('click', function () {
            var pid = $(currentTarget).parents('.extend-upsell-style').data().pid;
            window.extendModalReferenceId = pid;
        });
        $(currentTarget).contents().find('.simple-offer').addClass('chained');
        if ($(currentTarget).contents().find('button').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.simple-offer').removeClass('chained');
        }
    };
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
            };

            trackLinkClicked(data);
        });

        $(currentTarget).contents().find('.link').addClass('chained');
        if ($(currentTarget).contents().find('.link').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.link').removeClass('chained');
        }
    };
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
            };

            trackLinkClicked(data);
        });

        $(currentTarget).contents().find('.terms-link').addClass('chained');
        if ($(currentTarget).contents().find('.terms-link').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.terms-link').removeClass('chained');
        }
    };
    var timer = setInterval(addTrackEvent, 100);
}

module.exports = {
    trackExtendDOMNodeInserted: function () {
        $(document).on('DOMNodeInserted', 'body', function (e) {
            if (!Extend) {
                return;
            } else if (e.target.tagName && e.target.tagName.toLowerCase() !== 'iframe') {
                return;
            }
            var currentTarget = $(e.target);

                // trackOfferViewedModal and trackLinkClicked
            if ($(e.target).parents('.extend-upsell-style').length) {
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
            if (!data.extendAnalytics || !Extend) {
                return;
            }

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
        });
    },

    trackAddToCart: function () {
        $('body').on('product:afterAddToCart', function (e, data) {
            if (!Extend || !data.extendAnalytics) {
                return;
            }

            var eventData = data.extendAnalytics;
            var event = data.extendAnalytics.event;

            if (event === 'offerAddedToCart') {
                trackOfferAddedToCart(eventData);
            } else if (event === 'productAddedToCart') {
                trackProductAddedToCart(eventData);
            }
        });
    }
};

