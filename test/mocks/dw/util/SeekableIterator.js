class SeekableIterator {
    constructor(arr) {
        this._current = 0;
        this.count = arr.length;
        for(var key in arr) {
            this[key] = arr[key];
        }
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
}

module.exports = SeekableIterator;