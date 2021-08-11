'use strict';
var ProductVariationModel = require('./ProductVariationModel');
var ProductPriceModel = require('./ProductPriceModel');
class Product {
    constructor(props) {
        if (props) {
            this.ID = props.ID || '1234567';
        } else {
            this.ID = '1234567';
        } 
        this.name = 'test product';
        this.variant = true;
        this.price = 45;
        this.availabilityModel = {
            isOrderable: {
                return: true,
                type: 'function'
            },
            inventoryRecord: {
                ATS: {
                    value: 100
                }
            }
        };
        this.minOrderQuantity = {
            value: 2
        };
        this.variationModel = new ProductVariationModel();
        this.priceModel = new ProductPriceModel();
        this.master = false;
        this.image = {
            'small': {
                URL: 'testUrlSmall'
            },
            'medium': {
                URL: 'testUrlMedium'
            },
            'large': {
                URL: 'testUrlLarge'
            }
        };
    }

    getImage(size) {
        var _image = this.image[size];
        return {
            _image,
            getAbsURL() {
                return 'testAbsUrl';
            }
        };
    }

    getName() {
        return this.name;
    }
    getAvailabilityModel() {
        return {
            'availability': 1,
            'availabilityStatus': 'IN_STOCK',
            'inStock': true,
            'orderable': true,
            'SKUCoverage': 1,
            'timeToOutOfStock': 0,
            isOrderable() {
                return true;
            }
        };
    }

    getOnlineCategories() {
        var displayName = 'testCategory',
            length = 2,
            online = true,
            parent = {
                displayName: 'testCategoryParent',
                parent: null,
                length: 2
            };
        return {
            displayName: displayName,
            online: online,
            parent: parent,
            length: length,
            toArray: function() {
                return [{ 
                    displayName: displayName,
                    online: true,
                    parent: parent,
                    length: length
                }];
            }
        };
    }
    isVariant() {
        return this.variant;
    }

    isMaster() {
        return this.master;
    }

    getPriceModel() {
        return this.priceModel;
    }

    getVariationModel() {
        return this.variationModel;
    }
}

module.exports = Product;
