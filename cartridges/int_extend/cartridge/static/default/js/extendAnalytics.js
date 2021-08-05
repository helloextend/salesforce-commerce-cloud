'use strict';

var ExtendAnalytics = window.ExtendAnalytics || undefined;

function createAddToCartAnalytics(form) {
    var payload = {};
    payload.productId = form.find('input[name="pid"]').val();
    payload.quantity = form.find('input[name="Quantity"]').val();

    var area = form.find('input[name="eventArea"]').val();
    if (area) {
        payload.extendPlanId = form.find('input[name="extendPlanId"]').val();
        payload.area = form.find('input[name="eventArea"]').val();
        payload.component = form.find('input[name="eventType"]').val();
    }

    return payload;
}

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

function trackAddToCart(data) {
    if (data.extendPlanId) {
        ExtendAnalytics.trackOfferAddedToCart({
            productId: data.productId,
            productQuantity: +data.quantity,
            planId: data.extendPlanId,
            offerType: {
                area: data.area,
                component: data.component
            }
        });
    } else {
        ExtendAnalytics.trackProductAddedToCart({
            productId: data.productId,
            productQuantity: +data.quantity
        });
    }
}


function trackOfferRemovedFromCart(data) {
    ExtendAnalytics.trackOfferRemovedFromCart({
        productId: data.productID,
        planId: data.planId
    });
}

function trackProductRemovedFromCart(data) {
    ExtendAnalytics.trackProductRemovedFromCart({
        productId: data.productID,
    });
}

function trackProductUpdated(data) {
    ExtendAnalytics.trackProductUpdated({
        productId: data.productID,
        updates: {
            productQuantity: +data.productQuantity
        },
    });
}

function trackOfferUpdated(data) {
    ExtendAnalytics.trackOfferUpdated({
        productId: data.productID,
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
        productId = $('span[itemprop="productID"]').html();
    }
    trackOfferViewedPDP(productId);

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
        $(currentTarget).contents().find('.info-button').addClass('chained');
        if ($(currentTarget).contents().find('.info-button').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.info-button').removeClass('chained');
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

function addTrackEventUpsellCart(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.simple-offer').on('click', function () {
            var pid = $(currentTarget).parents('.extend-upsell-style').data().pid;
            window.extendModalReferenceId = pid;
            trackOfferViewedModal(pid, 'cart_page');
        });
        $(currentTarget).contents().find('.simple-offer').addClass('chained');
        if ($(currentTarget).contents().find('button').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.simple-offer').removeClass('chained');
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

function addTrackEventModal(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.link').on('click', function () {
            var productId;
            var area;
            var pdp = $('#pdpMain');

            if (pdp.length) {
                productId = pdp.find('span[itemprop="productID"]').html();
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

        $(currentTarget).contents().find('.link').addClass('chained');
        if ($(currentTarget).contents().find('.link').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.link').removeClass('chained');
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}

function trackModalLinkClicked(currentTarget) {
    var addTrackEvent = function () {
        $(currentTarget).contents().find('.terms-link').on('click', function () {
            var productId = $('span[itemprop="productID"]').html();

            var data = {
                linkEvent: 'plan_details_clicked',
                productId: productId,
                LinkTypeArea: 'learn_more_modal',
                LinkTypeComponent: 'see_plan_details_link'
            }

            trackLinkClicked(data);
        });

        $(currentTarget).contents().find('.terms-link').addClass('chained');
        if ($(currentTarget).contents().find('.terms-link').hasClass('chained')) {
            clearTimeout(timer);
            $(currentTarget).contents().find('.terms-link').removeClass('chained');
        }
    }
    var timer = setInterval(addTrackEvent, 100);
}



function trackExtendDOMNodeInserted() {
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
}

function trackCartUpdate() {
    var analyticsPayload = $('.analytics-payload');
    if (analyticsPayload.length) {
        var data = $('.analytics-payload').data().data;

        if (!data && !data.array) {
            return;
        }
        for (var i = 0; i < data.array.length; i++) {
            var current = data.array[i]

            if (current.event === 'productRemovedFromCart') {
                trackProductRemovedFromCart(current);
            } else if (current.event === 'offerRemovedFromCart') {
                trackOfferRemovedFromCart(current);
            } else if (current.event === 'productUpdated') {
                trackProductUpdated(current);
            } else if (current.event === 'offerUpdated') {
                trackOfferUpdated(current);
            }
        }
    }
}

function trackCheckoutBtn() {
    $('body').on('click', 'button[name="dwfrm_cart_checkoutCart"], .mini-cart-link-checkout', function () {
        var productAmmount = $('.mini-cart-subtotals').find('.value').html()
            || $('.order-subtotal')[1].html();

        productAmmount = productAmmount.slice(1);
        productAmmount = productAmmount.replace(',', '');

        ExtendAnalytics.trackCartCheckout({
            cartTotal: +productAmmount
        });
    })
}

function initExtendAnalytics() {
    var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
    ExtendAnalytics.config({ storeId: EXT_STORE_ID });
}

$(document).ready(function () {
    initExtendAnalytics();
    trackExtendDOMNodeInserted();
    trackCartUpdate();
    trackCheckoutBtn();
});