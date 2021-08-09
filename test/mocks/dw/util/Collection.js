'use strict';

class Collection {
    constructor(items) {
        this.items = [];
        if(items) {
            if(items instanceof Array) {
                for(var key in items) {
                    this[key] = this.items[key] = items[key];
                }
            } else {
                this[0] = this.items[0] = items;
            }
        }
        this.empty = !Boolean(this.items.length);
        this.length = this.items.length;
    }

    toArray() {
        return this.items;
    }

    iterator() {
        var index = 0;
        return {
            items: this.items,
            hasNext: () => {
                return index < this.items.length;
            },
            next: () => {
                return this.items[index++];
            }
        };
    }

    add(item) {
        this.items.push(item);
        this.empty = Boolean(this.items.length);
        this.length = this.items.length;
    }

    size() {
        return this.items.length;
    }
}

module.exports = Collection;
