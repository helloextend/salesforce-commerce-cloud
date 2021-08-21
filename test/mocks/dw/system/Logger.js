'use strict';

class Logger {
    getLogger(category, test) {
        return {
            category:category,
            error: function (msg) {
                return msg;
            },
            info: function (msg) {
                return msg;
            },
            debug: function (msg) {
                return msg;
            }
        };
    }
    

} 
module.exports = new Logger;
