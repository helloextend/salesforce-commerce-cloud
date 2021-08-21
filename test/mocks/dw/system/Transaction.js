'use strict';

class Transaction {
    wrap(wrapper) {
        wrapper();
    }
}

module.exports = new Transaction;