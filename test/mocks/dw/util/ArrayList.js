'use strict';

var Collection = require('./Collection');

function toArrayList(params) {
    return new Collection(params)
}

class ArrayList extends Array {
    contains(data) {
        return this.includes(data);
    }
    addAt(index, data) {
        var arr = [];
        arr[index] = data;

    }
}
module.exports = {
    ArrayList: ArrayList,
    toArrayList: toArrayList
}
