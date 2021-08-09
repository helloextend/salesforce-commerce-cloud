'use strict';

class ArrayList extends Array {
    contains(data) {
        return this.includes(data);
    }
    addAt(index, data) {
        var arr = [];
        arr[index] = data;

    }
}
module.exports = ArrayList;
