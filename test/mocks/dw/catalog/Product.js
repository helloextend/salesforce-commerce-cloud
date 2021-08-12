'use strict';
var ProductVariationModel = require('./ProductVariationModel');
var ProductPriceModel = require('./ProductPriceModel');

function getProductPrimaryCategory(props) {
    if (props && props.noCategory) {
        return;
    }

    return {
        name: 'Mens clothing',
        id: 'Mens',
        getID: function () {
            return this.id;
        }
    }
}

class Product {
    constructor(props) {
        if (props) {
            this.ID = props.ID || '1234567';
            this.master = props.master || false;
        } else {
            this.ID = '1234567';
            this.master = false;
        } 
        this.name = 'test product';
        this.variant = !this.master;
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

        if (!this.master) {
            this.masterProduct = {
                getPrimaryCategory: function () {
                    return this.primaryCategory;
                },
                primaryCategory: getProductPrimaryCategory(props)
            }
        } else {
            this.primaryCategory = getProductPrimaryCategory(props);
        }

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

    getPrimaryCategory() {
        return this.primaryCategory;
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

    getMasterProduct() {
        return this.masterProduct;
    }
}

module.exports = Product;
