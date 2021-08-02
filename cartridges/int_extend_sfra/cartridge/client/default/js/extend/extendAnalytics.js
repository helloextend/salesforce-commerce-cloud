'use strict';

var ExtendAnalytics = window.ExtendAnalytics || undefined;

function trackOfferViewedModal(data, area) {
    console.log('trackOfferViewed.PDP.modal');
    ExtendAnalytics.trackOfferViewed(
        {
            productId: data.pid,
            offerType: {
                area: area,
                component: 'modal'
            }
        }
    );
}

function trackProductAddedToCart(data) {
    console.log(data);
    console.log('trackProductAddedToCart');
    ExtendAnalytics.trackProductAddedToCart(
        {
            productId: data.productId,
            productQuantity: data.productQuantity
        }
    );
}

function trackOfferAddedToCart(data) {
    console.log(data);
    console.log('trackOfferAddedToCart');
    ExtendAnalytics.trackOfferAddedToCart(
        {
            productId: data.productId,
            productQuantity: data.productQuantity,
            planId: data.extendPlanId,
            offerType: {
                area: data.offerTypeArea,
                component: data.offerTypeComponent
            }
        }
    );
}

function trackOfferRemovedFromCart(data) {
    console.log(data);
    console.log('trackOfferRemovedFromCart');
    ExtendAnalytics.trackOfferRemovedFromCart(
        {
            productId: data.referenceId,
            planId: data.planId
        }
    );
}

function trackProductRemovedFromCart(data) {
    console.log('trackProductRemovedFromCart');
    console.log(data);
    ExtendAnalytics.trackProductRemovedFromCart(
        {
            productId: data.productId,
        }
    );
}

function trackProductUpdated(data) {
    console.log(data);
    console.log('trackProductUpdated');
    ExtendAnalytics.trackProductUpdated(
        {
            productId: data.productId,
            updates: {
                productQuantity: +data.productQuantity
            },
        }
    );
}

function trackOfferUpdated(data) {
    console.log(data);
    console.log('trackOfferUpdated');
    ExtendAnalytics.trackOfferUpdated(
        {
            productId: data.productId,
            planId: data.planId,
            updates: {
                warrantyQuantity: +data.warrantyQuantity,
                productQuantity: +data.productQuantity,
            },
        }
    );
}

function trackCartCheckout(params) {
    ExtendAnalytics.config(
        {
            cartTotal: params.cartTotal
        }
    );
}

function trackLinkClicked(params) {
    ExtendAnalytics.config(
        {
            linkEvent: params.linkEvent,
            productId: params.productId,
            linkType: {
                area: params.area,
                component: params.component
            }
        }
    );
}


module.exports = {
    methods: {
        trackOfferViewedModal: trackOfferViewedModal,
        trackProductAddedToCart: trackProductAddedToCart,
        trackOfferAddedToCart: trackOfferAddedToCart
    },

    initExtendAnalytics: function () {
        var EXT_STORE_ID = window.EXT_STORE_ID || undefined;
        ExtendAnalytics.config({ storeId: EXT_STORE_ID });
    },

    trackOfferViewedPDP: function () {
        $(document).on('DOMNodeInserted', '#extend-offer', function (e) {
            if (e.target.tagName.toLowerCase() === 'iframe') {
                var productId;
                var extendComponent = Extend.buttons.instance('#extend-offer');

                if (extendComponent) {
                    productId = extendComponent.getActiveProduct().id;
                } else {
                    productId = $('.product-detail').data('pid');
                }
                console.log('trackOfferViewed.PDP.buttons')
                ExtendAnalytics.trackOfferViewed({
                    productId: productId,
                    offerType: {
                        area: 'product_page',
                        component: 'buttons'
                    }
                });
            }
        });
    },

    trackOfferViewedCartModal: function () {
        $(document).on('DOMNodeInserted', 'body', function (e) {
            if (e.target.id === 'extend-offers-modal-iframe') {
                console.log(e);
                // var extendComponent = Extend.buttons.instance('#extend-offer');
                // console.log(extendComponent.getActiveProduct());
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

    trackAfterAddToCart: function () {
        $('body').on('product:afterAddToCart', function (e, data) {
            if (data.extendAnalytics) {
                var eventData = data.extendAnalytics;
                var event = data.extendAnalytics.event;

                if (event === 'productAddedToCart') {
                    trackProductAddedToCart(eventData)
                } else if (event === 'offerAddedToCart') {
                    trackOfferAddedToCart(eventData)
                }
            }
        });
    },

};
