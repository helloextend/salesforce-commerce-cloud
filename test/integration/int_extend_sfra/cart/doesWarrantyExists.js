var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../../it.config');

describe('Cart', function () {
    describe('Cart-DoesWarrantyExists', function () {
        this.timeout(10000);

        // The 'url' property will be updated on every request to set the product ID (pid) and quantity.
        // All other properties remained unchanged.
        var myRequest = {
            url: config.baseUrl + '/Cart-DoesWarrantyExists',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        it('should succesfully check whether warranty exists', function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    'Expected statusCode to be 200.'
                );
            });
        });
    });
});
