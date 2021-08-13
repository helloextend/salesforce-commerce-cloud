'use strict';

var Product = require('./Product');

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

class Variant extends Product {
    constructor(obj) {
        super();
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                this[k] = obj[k];
            }
        }
        this.variant = true;
        this.master = false;
        this.masterProduct = {
            ID: '8888888',
            primaryCategory: getProductPrimaryCategory(obj),
            getPrimaryCategory: function () {
                return this.primaryCategory;
            },
            getID: function () {
                return this.ID;
            },
            getOnlineCategories: function () {
                var displayName = 'testCategoryVariant',
                    length = 2,
                    parent = {
                        displayName: 'testCategoryVariantParent',
                        parent: null,
                        length: 2
                    };
                return {
                    displayName: displayName,
                    parent: parent,
                    length: length,
                    toArray: function () {
                        return [{
                            displayName: displayName,
                            parent: parent,
                            length: length
                        }];
                    }
                };
            }
        }
    }

    getMasterProduct() {
        return this.masterProduct;
    }
}
module.exports = Variant;