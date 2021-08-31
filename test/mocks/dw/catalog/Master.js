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

class Master extends Product {
    constructor(obj) {
        super();
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                this[k] = obj[k];
            }
        }
        this.variant = false;
        this.master = true;
        this.primaryCategory = getProductPrimaryCategory(obj);
    }

    getPrimaryCategory() {
        return this.primaryCategory;
    }
}
module.exports = Master;