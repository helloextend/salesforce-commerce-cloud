'use strict';

var Product = require('./Product');

class Variant extends Product {
    constructor(obj) {
        super();
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                this[k] = obj[k];
            }
        }
        this.masterProduct = {
            getOnlineCategories: function() {
                var displayName = 'testCategoryVariant',
                    length = 2,
                    parent = {
                        displayName : 'testCategoryVariantParent',
                        parent: null,
                        length: 2
                    };
                return {
                    displayName:displayName,
                    parent:parent,
                    length: length,
                    toArray: function() {
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

}
module.exports = Variant;
