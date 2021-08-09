'use strict';

class Calendar {
    constructor(date) {
        this.time = (date && date instanceof Date) ? date : new Date();
    }
}

module.exports = Calendar;
