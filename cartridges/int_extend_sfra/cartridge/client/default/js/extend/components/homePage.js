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

module.exports = {
    modalOpen: function () {
        $(document).onload(function () {
            var Extend = window.Extend || undefined;
            var EXT_PDP_UPSELL_SWITCH = window.EXT_PDP_UPSELL_SWITCH || undefined;

            if (!Extend) {
                return;
            }

            extendInit(Extend);
            var queryParameters = window.location.search.substring(1).split('&');
            var isLeadToken = isLeadTokenInURL(queryParameters);
            var leadToken;
        
            if (isLeadToken && EXT_PDP_UPSELL_SWITCH) {
                leadToken = getLeadToken(queryParameters);
        
                Extend.aftermarketModal.open({
                    leadToken: leadToken
                });
            }
        });
    }
};

