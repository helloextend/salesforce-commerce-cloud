'use strict';

class Bytes {
    constructor(phrase, encode = 'UTF-8') {
        this.phrase = phrase;
        this.encode = encode;
    }

    toString() {
        return this.phrase;
    }
}

module.exports = Bytes;
