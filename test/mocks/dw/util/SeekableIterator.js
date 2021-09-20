var Collection = require('./Collection');

class SeekableIterator {
    constructor(arr) {
        this._current = 0;
        this.count = arr.length;
        for(var key in arr) {
            this[key] = arr[key];
        }
        this.items = arr;
    }

    hasNext() {
        return this._current < this.count;
    }

    next() {
        var next = null;
        if( this.hasNext() ) {
            next = this[this._current++];
        }
        return next;
    }

    close() {
        return true;
    }

    asList() {
        return new Collection(this.items);
    }

    getCount() {
        return this.count;
    }
}

module.exports = SeekableIterator;