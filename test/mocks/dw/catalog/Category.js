'use strict';

var Collection = require('./../util/Collection');

class Category {
    constructor(displayName = 'testDisplayName') {
        this.custom = {
            hideInMobileNavigation: false
        };
        this.ID = 'testID';
        this.displayName = displayName;
        this.subcategories = new Collection();

        this.online = true;
        this.root = false;
        this.parent = {};
    }

    getID() {
        return this.ID;
    }

    getDisplayName() {
        return this.displayName;
    }

    hasOnlineSubCategories() {
        return Boolean(this.subcategories.length);
    }

    getOnlineSubCategories() {
        return this.subcategories;
    }

    hasOnlineProducts() {
        return true;
    }
}

module.exports = Category;
