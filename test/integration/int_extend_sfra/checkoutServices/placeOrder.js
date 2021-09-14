var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Place order', function () {
    this.timeout(50000);

    var extendProduct = 'EXTEND-12';
    var qtyExtend = 1;
    var redirectedUrl = config.baseUrl + '/Cart-Show';

    var cookieJar = request.jar();
    var myRequest = {
        url: config.baseUrl + '/CheckoutServices-PlaceOrder',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    it('should place order and create custom object', function () {
        myRequest.form = {
            pid: extendProduct,
            qty: qtyExtend,
            redirectedUrl: redirectedUrl
        };

        return request(myRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200);
            var expectedItem = {
                orderNo: '345021307483&',
                orderTotal: 30000,
                currency: 'USD',
                plan: {
                    planId: '10001-misc-elec-adh-replace-1y',
                    purchasePrice: 499
                },
                product: {
                    referenceId: 'SKU-123-111',
                    purchasePrice: 14999,
                    serialNumber: 'ABCD123111'
                },
                customer: {
                    phone: '123-456-7890',
                    email: 'myemail@gmail.com',
                    name: 'John Doe',
                    address: {
                        address1: '535 Mission Street',
                        address2: '11th Floor',
                        city: 'Nevercity',
                        countryCode: 'US',
                        postalCode: '94526',
                        provinceCode: 'CA'
                    }
                },
                redirectedUrl: '/on/demandware.store/Sites-RefArch-Site/en_US/Cart-Show'
            };
            var bodyAsJson = JSON.parse(response.body);
            assert.equal(bodyAsJson.redirectUrl, expectedItem.redirectedUrl);
        });
    });
});
