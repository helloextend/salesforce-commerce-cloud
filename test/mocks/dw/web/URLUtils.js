'use strict';

var URL = require('./URL');

class URLUtils {
    constructor(action, params) {
        this.action = action;
        this.params = params;
    }
    url (action) {
        // handle params
        var params = [];
        if (arguments.length > 1) {
            if (arguments.length % 2 === 1) {
                var param = '';
                for (var i = 1; i < arguments.length; i++) {
                    // key
                    if (i % 2 === 1) {
                        param = arguments[i];
                    // value
                    } else {
                        param += '=' + arguments[i];
                        params.push(param);
                    }
                }
            }
        }
        params = params.length ? '?' + params.join('&') : '';

        return 'http://example.demandware.net/' + action + params;
    }

    http (action, namesAndParams) {
        return action + '/' + namesAndParams;
    }
    https (action, namesAndParams) {
        var params = Object.assign({}, action, namesAndParams);
        var url = new URL(params);
        return url;
    }
    staticURL(namesAndParams) {
        return 'http://example.demandware.net/' + namesAndParams;
    }
}

module.exports = new URLUtils;
