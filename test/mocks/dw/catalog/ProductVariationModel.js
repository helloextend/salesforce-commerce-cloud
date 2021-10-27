'use strict';

class ProductVariationModel {
    constructor() {
        this.productMaster = {
            ID: '1111'
        };
    }
    getProductVariationAttribute(id) {
        return id;
    }
    getSelectedValue(attribute) {
        return {
            displayValue:attribute
        };
    }

    getMaster() {
        return this.productMaster;
    }
}

module.exports = ProductVariationModel;