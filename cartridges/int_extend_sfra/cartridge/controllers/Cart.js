/* eslint-disable no-undef */
/* eslint-disable one-var */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* eslint-disable block-scoped-var */
/* eslint-disable radix */
/* eslint-disable no-param-reassign */
/* eslint-disable valid-jsdoc */
'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

/**
 * Handle Extend products when adding regular product to cart
 */
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var CartModel = require('*/cartridge/models/cart');
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var extendHelpers = require('~/cartridge/scripts/helpers/extendHelpers');
    var extendWarrantyLineItemHelpers = require('*/cartridge/scripts/helpers/extendWarrantyLineItemHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    var form = req.form;
    var viewData = res.getViewData(); // pliUUID

    var isOfferValide = extendHelpers.validateOffer(form);

    if (isOfferValide && form.extendPlanId && form.extendPrice && form.extendTerm && !req.form.pidsObj) {
        var product = ProductMgr.getProduct('EXTEND-' + form.extendTerm);
        var parentLineItem;

        // Determine the parent product for the current Extend warranty product
        for (var i = 0; i < currentBasket.productLineItems.length; i++) {
            if (currentBasket.productLineItems[i].UUID === viewData.pliUUID) {
                parentLineItem = currentBasket.productLineItems[i];
                break;
            }
        }

        // Determine whether warranty line item already exists for this product line item
        var currentWarrantyLi;
        var warrantyLis = currentBasket.getProductLineItems('EXTEND-' + form.extendTerm);
        for (var i = 0; i < warrantyLis.length; i++) {
            if (warrantyLis[i].custom.parentLineItemUUID === parentLineItem.UUID) {
                currentWarrantyLi = warrantyLis[i];
                break;
            }
        }

        // Determine whether the product already has any warranty in cart
        var isWarrantyInCart = false;
        var productLineItems = currentBasket.getAllProductLineItems();
        for (var i = 0; i < productLineItems.length; i++) {
            var pLi = productLineItems[i];
            if (pLi.custom.persistentUUID && (pLi.productID === form.pid)) {
                isWarrantyInCart = true;
            }
        }

        var quantityTotal = null;

        if (currentWarrantyLi) {
            extendWarrantyLineItemHelpers.updateExtendWarranty(currentWarrantyLi, form);
        } else {
            extendWarrantyLineItemHelpers.addExtendWarrantyToCart(currentBasket, product, parentLineItem, form);
        }

        quantityTotal = !isWarrantyInCart ? viewData.quantityTotal + parseInt(form.quantity, 10) : viewData.quantityTotal;

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
        var cartModel = new CartModel(currentBasket);

        // Update totalQuantity with quantity of Extend warranties that's been added to cart
        res.setViewData({
            cart: cartModel,
            quantityTotal: quantityTotal
        });
    }

    return next();
});

/**
 * Check productId already have an extend product associated
 * This is used in cart to asynchronously enable up-sell modal
 */
server.get('DoesWarrantyExists', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var qs = req.querystring;
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var pid,
        qty,
        lead;

    // Query string parameter wasn't provided
    if (!qs.uuid) {
        res.json({
            isEligible: false
        });

        next();
        return;
    }

    // Check if there's already an Extend product attached to this line item or current product is Extend Product
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].custom.parentLineItemUUID === qs.uuid || (!empty(currentBasket.productLineItems[i].custom.parentLineItemUUID) && currentBasket.productLineItems[i].getUUID() === qs.uuid)) {
            res.json({
                isEligible: false
            });

            next();
            return;
        }
    }

    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].UUID === qs.uuid) {
            pid = currentBasket.productLineItems[i].productID;
            qty = currentBasket.productLineItems[i].quantityValue;
            lead = currentBasket.productLineItems[i];
            break;
        }
    }

    // No line item with the provided UUID was found in current basket
    if (!pid) {
        res.json({
            isEligible: false
        });

        next();
        return;
    }

    Transaction.wrap(function () {
        lead.custom.isWarrantable = true;
    });

    res.json({
        isEligible: true,
        pid: pid,
        qty: qty
    });

    next();
});

/**
 * Handle Extend products when adding to cart from up-sell modal
 */
server.post('AddExtendProduct', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var extendHelpers = require('~/cartridge/scripts/helpers/extendHelpers');
    var extendWarrantyLineItemHelpers = require('*/cartridge/scripts/helpers/extendWarrantyLineItemHelpers');

    var form = req.form;
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isOfferValide = extendHelpers.validateOffer(form);

    if (!isOfferValide) {
        res.json({
            error: true
        });

        return next();
    }

    var product = ProductMgr.getProduct('EXTEND-' + form.extendTerm);
    var parentLineItem;

    // Determine the parent product for the current Extend warranty product
    for (var i = 0; i < currentBasket.productLineItems.length; i++) {
        if (currentBasket.productLineItems[i].UUID === form.pliUUID) {
            parentLineItem = currentBasket.productLineItems[i];
            break;
        }
    }

    extendWarrantyLineItemHelpers.addExtendWarrantyToCart(currentBasket, product, parentLineItem, form);

    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var basketModel = new CartModel(currentBasket);

    res.json(basketModel);
    return next();
});


/**
 * Handle deletion of Extend parent line item
 */
server.append('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket || !req.querystring.pid || !req.querystring.uuid) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var isProductLineItemFound = false;
    var extendProductsUUIDs = [];

    Transaction.wrap(function () {
        var productLineItems = currentBasket.getAllProductLineItems();

        for (var i = 0; i < productLineItems.length; i++) {
            var item = productLineItems[i];
            if ((item.custom.parentLineItemUUID === req.querystring.uuid)) {
                var shipmentToRemove = item.shipment;
                currentBasket.removeProductLineItem(item);
                extendProductsUUIDs.push(item.UUID);
                isProductLineItemFound = true;
                if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                    currentBasket.removeShipment(shipmentToRemove);
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var basketModel = new CartModel(currentBasket);
    if (isProductLineItemFound) {
        res.json({
            basket: basketModel,
            toBeDeletedUUIDs: extendProductsUUIDs
        });
    } else {
        res.json({
            basket: basketModel
        });
    }

    return next();
});

/**
 * ExtendAnalytics
 */
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var extendAnalyticsHelpers = require('*/cartridge/scripts/helpers/extendAnalyticsHelpers');

    var analyticsSDK = Site.getCurrent().getCustomPreferenceValue('extendAnalyticsSwitch');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var form = req.form;

    if (!analyticsSDK || !currentBasket || !form.pid) {
        return next();
    }

    var addedProduct;
    var productLineItems = currentBasket.getAllProductLineItems(form.pid);

    if (productLineItems.length === 0) {
        return next();
    }

    for (var i = 0; i < productLineItems.length; i++) {
        if (productLineItems[i].productID === form.pid) {
            addedProduct = productLineItems[i];
        }
    }

    if (!addedProduct) {
        return next();
    }

    var extendProduct = extendAnalyticsHelpers.getExtendProduct(currentBasket, addedProduct);

    if (!form.extendPlanId) {
        viewData.extendAnalytics = extendAnalyticsHelpers.getProductAddedToCartData(addedProduct, form);
    } else if (form.extendPlanId) {
        viewData.extendAnalytics = extendAnalyticsHelpers.getOfferAddedToCartData(addedProduct, form);
    }

    res.setViewData(viewData);
    return next();
});

/**
 * Add tracking of removing plans and products from cart
 */
server.prepend('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var extendAnalyticsHelpers = require('*/cartridge/scripts/helpers/extendAnalyticsHelpers');

    var analyticsSDK = Site.getCurrent().getCustomPreferenceValue('extendAnalyticsSwitch');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();
    var productId = req.querystring.pid;
    var uuid = req.querystring.uuid;

    if (!analyticsSDK || !productId || !uuid) {
        return next();
    }

    var removedProduct;
    var removedExtendPlan;
    var productLineItems = currentBasket.getAllProductLineItems(productId);

    for (var i = 0; i < productLineItems.length; i++) {
        if (extendAnalyticsHelpers.isExtendProduct(productLineItems[i], uuid)) {
            removedExtendPlan = productLineItems[i];
        } else {
            removedProduct = productLineItems[i];
        }
    }

    if (removedProduct) {
        if (removedProduct.custom.persistentUUID) {
            var extendProduct = extendAnalyticsHelpers.getExtendProduct(currentBasket, removedProduct);

            if (extendProduct) {
                return next();
            }
            viewData.extendAnalytics = extendAnalyticsHelpers.getProductRemovedFromCartData(removedProduct);
        }
    } else if (removedExtendPlan) {
        var removedExtendedProduct = extendAnalyticsHelpers.getExtendedProduct(currentBasket, removedExtendPlan);
        viewData.extendAnalytics = extendAnalyticsHelpers.getOfferRemovedFromCartData(removedExtendedProduct, removedExtendPlan);
    }
    res.setViewData(viewData);

    return next();
});

/**
 * Add tracking of updating plans and products quantity
 */
server.append('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var extendAnalyticsHelpers = require('*/cartridge/scripts/helpers/extendAnalyticsHelpers');

    var analyticsSDK = Site.getCurrent().getCustomPreferenceValue('extendAnalyticsSwitch');
    var currentBasket = BasketMgr.getCurrentBasket();
    var viewData = res.getViewData();

    if (!analyticsSDK || !viewData.items) {
        return next();
    }

    if (currentBasket) {
        var productId = req.querystring.pid;
        var uuid = req.querystring.uuid;
        var updatedProduct;
        var updatedExtendPlan;
        var productLineItems = currentBasket.getAllProductLineItems(productId);

        if (productLineItems.length === 0) {
            return next();
        }

        for (var i = 0; i < productLineItems.length; i++) {
            if (extendAnalyticsHelpers.isExtendProduct(productLineItems[i], uuid)) {
                updatedExtendPlan = productLineItems[i];
            } else {
                updatedProduct = productLineItems[i];
            }
        }

        if (updatedProduct) {
            if (updatedProduct.custom.persistentUUID) {
                var extendProduct = extendAnalyticsHelpers.getExtendProduct(currentBasket, updatedProduct);

                if (extendProduct) {
                    viewData.extendAnalytics = extendAnalyticsHelpers.getOfferUpdatedData(updatedProduct, extendProduct);
                } else {
                    viewData.extendAnalytics = extendAnalyticsHelpers.getProductUpdatedData(updatedProduct);
                }
            } else {
                viewData.extendAnalytics = extendAnalyticsHelpers.getProductUpdatedData(updatedProduct);
            }
        } else if (updatedExtendPlan) {
            var updatedExtendedProduct = extendAnalyticsHelpers.getExtendedProduct(currentBasket, updatedExtendPlan);
            viewData.extendAnalytics = extendAnalyticsHelpers.getOfferUpdatedData(updatedExtendedProduct, updatedExtendPlan);
        }
        res.setViewData(viewData);
    }
    return next();
});

/**
 * Update Extend Shipping Protection Value
 */
server.append('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var extendShippingProtectionHelpers = require('*/cartridge/scripts/helpers/extendShippingProtectionHelpers');

    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            return next();
        }
        extendShippingProtectionHelpers.createOrUpdateExtendShippingProtectionQuote(currentBasket);
    
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
    }

    return next();
});

/**
 * Get Extend Shipping Protection Config
 */
server.get('GetConfig', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
    var logger = require('dw/system/Logger').getLogger('Extend', 'Extend');
    var extend = require('~/cartridge/scripts/extend');
    var extendShippingProtectionHelpers = require('*/cartridge/scripts/helpers/extendShippingProtectionHelpers');

    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            return next();
        }

        try {
            var extendShippingProtectionConfig = extend.getExtendShippingProtectionConfig();
            var attachBehavior = extendShippingProtectionConfig.config.attachBehavior;

            Transaction.wrap(function () {
                currentBasket.custom.extendShippingProtectionAttachBehaviour = attachBehavior;
            });

            extendShippingProtectionHelpers.processExtendShippingProtectionConfig(currentBasket, attachBehavior);

            res.json({
                attachBehavior: attachBehavior
            });
        } catch (error) {
            logger.error('Failed to receive Extend Shipping Protection config. {0}', error);
        }
    }

    return next();
});

/**
 * Create Extend Shipping Quotes. Make a call to Shipping API.
 */
server.post('ShippingProtectionCreateQuotes', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var extend = require('~/cartridge/scripts/extend');
    var extendShippingProtectionHelpers = require('*/cartridge/scripts/helpers/extendShippingProtectionHelpers');

    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var currentBasket = BasketMgr.getCurrentBasket();

        var storeID = Site.getCurrent().getCustomPreferenceValue('extendStoreID');
    
        var viewData = res.getViewData();
    
        if (viewData.error) {
            return next();
        }
    
        var products = [];
    
        if (currentBasket) {
            products = extendShippingProtectionHelpers.getProductToCreateQuotes(currentBasket);
        }
    
        var createsShippingOfferQuotes = extend.createsShippingOfferQutes(storeID, products);
    
        var cartItems = createsShippingOfferQuotes.items;
        var shippingOfferQuotes = createsShippingOfferQuotes.response;
    
        var basketModel = new CartModel(currentBasket);
    
        viewData.cartItems = cartItems;
        viewData.shippingOfferQuotes = shippingOfferQuotes;
        viewData.cart = basketModel;

        var shippingProtectionLineItem = null;

        var allLineItems = currentBasket.getAllProductLineItems();
        collections.forEach(allLineItems, function (productLineItem) {
            if (productLineItem.custom.isExtendShippingProtection) {
                shippingProtectionLineItem = productLineItem;
            }
        });

        var attachBehavior = currentBasket.custom.extendShippingProtectionAttachBehaviour;

        var isExtendShippingProtectionAttend = extendShippingProtectionHelpers.isExtendShippingProtectionAttend(currentBasket);
        var isExtendShippingProtectionAdded = currentBasket.custom.isExtendShippingProtectionAdded;
        var isExtendShippingProtectionRemoved = currentBasket.custom.isExtendShippingProtectionRemoved;

        if (shippingProtectionLineItem) {
            // Add quotes info to order info to create a shipping protection plan line item
            Transaction.wrap(function () {
                shippingProtectionLineItem.custom.extendShippingQuoteId = shippingOfferQuotes.id;
            });
        }

        res.setViewData(viewData);
    
        res.json({
            cartItems: cartItems,
            cart: basketModel,
            attachBehavior: attachBehavior,
            isExtendShippingProtectionAttend: isExtendShippingProtectionAttend,
            isExtendShippingProtectionAdded: isExtendShippingProtectionAdded,
            isExtendShippingProtectionRemoved: isExtendShippingProtectionRemoved
        });
    }
    return next();
});

/**
 * Add Extend Shipping Offer via cart
 */
server.post('AddExtendShippingOffer', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
    var CartModel = require('*/cartridge/models/cart');
    var extendShippingProtectionHelpers = require('*/cartridge/scripts/helpers/extendShippingProtectionHelpers');

    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            return next();
        }
    
        extendShippingProtectionHelpers.createOrUpdateExtendShippingProtectionQuote(currentBasket);

        Transaction.wrap(function () {
            currentBasket.custom.isExtendShippingProtectionAdded = true;
            currentBasket.custom.isExtendShippingProtectionRemoved = false;
        });
    
        var basketModel = new CartModel(currentBasket);
    
        res.json({
            cart: basketModel
        });
    }

    return next();
});

/**
 * Remove Shipping Protection from the cart
 */
server.post('RemoveShippingProtection', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentAPIversion = Site.getCurrent().getCustomPreferenceValue('extendAPIMethod').value;
    var isExtendShippingProtection = Site.getCurrent().getCustomPreferenceValue('extendShippingProtectionSwitch');

    if (currentAPIversion !== 'contractsAPIonSchedule' && isExtendShippingProtection) {
        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
    
            return next();
        }
    
        var isShippingProtectionFound = false;
        var shippingProtectionLineItem = null;

        var allLineItems = currentBasket.getAllProductLineItems();
        collections.forEach(allLineItems, function (productLineItem) {
            if (productLineItem.custom.isExtendShippingProtection) {
                isShippingProtectionFound = true;
                shippingProtectionLineItem = productLineItem;
            }
        });

        Transaction.wrap(function () {
            if (!shippingProtectionLineItem) {
                return;
            } else if (isShippingProtectionFound && shippingProtectionLineItem) {
                currentBasket.removeProductLineItem(shippingProtectionLineItem);
            }

            currentBasket.custom.isExtendShippingProtectionAdded = false;
            currentBasket.custom.isExtendShippingProtectionRemoved = true;

            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new CartModel(currentBasket);

        res.json({
            cart: basketModel
        });
    }

    return next();
});

module.exports = server.exports();
