'use strict';

var Collection = require('./Collection');

function toArrayList(params) {
    return new Collection(params)
}


class ArrayList {
    constructor() {
        this.items = [];
        this.length = 0;
    }

    contains(data) {
        return this.includes(data);
    }

    addAt(index, data) {
        var arr = [];
        arr[index] = data;
    }

    push(item) {
        this.length = this.length + 1;
        this.items.push(item);
    }

    clear(item) {
        this.length = 0;
        this.items = [];
    }
}

module.exports = {
    ArrayList: ArrayList,
    toArrayList: toArrayList
}
