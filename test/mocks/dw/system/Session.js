'use strict'
var OrderAddress = require('../order/OrderAddress');

class Session {
    constructor() {
        this.forms = {
            emarsyssignup: {
                emailAddress: {
                    value: 'test@test.com'
                }
            },
            billing: {
                subscribe: {
                    value: true
                }
            }
        };
        this.customer = {
            authenticated: true,
                addressBook: {
                    addresses: [new OrderAddress()]
                }
        };
        this.currency = {
            currencyCode: 'USD'
        };
    }
    setCurrency(currency) {
      //  this.currency = currency;
        return currency;
    }
}

module.exports = Session;
