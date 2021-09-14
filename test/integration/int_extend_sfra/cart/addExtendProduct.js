var assert = require('chai').assert;
var request = require('request-promise');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);
var config = require('../../it.config');

describe('Cart', function () {
    describe('Cart-AddExtendProduct', function () {
        this.timeout(10000);

        it('should add extend product and returns total quantity of added items', function () {
            var cookieJar = request.jar();

            // The myRequest object will be reused through out this file. The 'jar' property will be set once.
            // The 'url' property will be updated on every request to set the product ID (pid) and quantity.
            // All other properties remained unchanged.
            var myRequest = {
                url: '',
                method: 'POST',
                rejectUnauthorized: false,
                resolveWithFullResponse: true,
                jar: cookieJar,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            };

            var cookieString;

            var variantPid1 = 'EXTEND-12';
            var qty1 = 1;

            var action = 'Cart-AddExtendProduct';
            var addExtendProduct = '/Cart-AddExtendProduct';
            var redirectUrl = config.baseUrl + '/Cart+Show';

            // ----- adding extend product:
            myRequest.url = config.baseUrl + addExtendProduct;
            myRequest.form = {
                pid: variantPid1,
                action: action,
                quantity: qty1,
                redirectUrl: redirectUrl
            };

            return request(myRequest)
                .then(function (response) {
                    assert.equal(response.statusCode, 200, 'Expected statusCode to be 200');

                    var expectedResBody = {
                        pid: variantPid1,
                        action: action,
                        quantity: qty1,
                        redirectUrl: redirectUrl
                    };

                    var bodyAsJson = JSON.parse(response.body);
                    assert.equal(bodyAsJson.redirectUrl, expectedResBody.redirectUrl);

                    cookieString = cookieJar.getCookieString(myRequest.url);
                })
                .catch(function (error) {
                    assert.equal(error.statusCode, 500, 'Expected statusCode to be 500');
                });
        });
    });
});
