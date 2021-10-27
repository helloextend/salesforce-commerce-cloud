/* eslint-disable no-continue */
'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

/**
 * Warranty-AddWarranty : This endpoint is called to add the warranty from PDP
 */
server.get('AddWarranty', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var data = req.querystring;
    var token = data.token;
    var order = OrderMgr.getOrder(data.orderID);

    if (!order) {
        return next();
    }

    if (!token) {
        return next();
    }

    var pLItems = order.defaultShipment.productLineItems;
    var pLi = null;

    for (var i = 0; i < pLItems.length; i += 1) {
        pLi = pLItems[i];
        if (!pLi.custom.leadToken) {
            continue;
        }
        if (pLi.custom.leadToken !== token) {
            continue;
        }
    }

    var productId = pLi.productID;
    var pid = {
        pid: productId
    };
    var showProductPageHelperResult = productHelper.showProductPage(pid, req.pageMetaData);

    var productType = showProductPageHelperResult.product.productType;
    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        var pageLookupResult = productHelper.getPageDesignerProductPage(showProductPageHelperResult.product);

        if ((pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) || pageLookupResult.invisiblePage) {
            // the result may be different for another user, do not cache on this level
            // the page itself is a remote include and can still be cached
            res.cachePeriod = 0; // eslint-disable-line no-param-reassign
        }
        if (pageLookupResult.page) {
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        } else {
            res.render(showProductPageHelperResult.template, {
                product: showProductPageHelperResult.product,
                addToCartUrl: showProductPageHelperResult.addToCartUrl,
                resources: showProductPageHelperResult.resources,
                breadcrumbs: showProductPageHelperResult.breadcrumbs,
                canonicalUrl: showProductPageHelperResult.canonicalUrl,
                schemaData: showProductPageHelperResult.schemaData
            });
        }
    }
    return next();
}, pageMetaData.computedPageMetaData);


module.exports = server.exports();
