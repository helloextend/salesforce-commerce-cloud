'use strict';

class Request {
    constructor() {
        this.httpParameterMap = {
            q: {
                value: 'red T-shirt'
            },
            uid: {
                stringValue: 'e6032325a4f6a31032a5d17aeb'
            },
            formatajax: {
                stringValue: 'true'
            },
            dwfrm_profile_customer_addtoemaillist: {
                booleanValue: true
            }
        };
        this.locale = 'en_US';
    }
    getLocale() {
        return this.locale;
    }
    setLocale(locale) {
        this.locale = locale;
        return true;
    }
}

module.exports = Request;
