'use strict';

var Service = require('./Service');
var responseDataMock = require('./../../restServices/responseDataMock')

function getResponse(url) {
    var response = {}
    if (url === 'https://api-demo.helloextend.com/stores/123456789O12/contracts') {
        response.text = JSON.stringify(responseDataMock.createContractResponseSuccessMock);
    } else if (url === 'https://api-demo.helloextend.com/offers?storeId=123456789O12&productId=1234567') {
        response.text = JSON.stringify(responseDataMock.getOfferResponseSuccessMock);
    } else if (url === 'https://api-demo.helloextend.com/stores/123456789O12/products') {
        response.text = JSON.stringify(responseDataMock.createProductResponseSuccessMock);
    } else if (url === 'https://api-demo.helloextend.com/offers?storeId=123456789O12&productId=1234567') {
        response.text = JSON.stringify(responseDataMock.offersResponseMock);
    } else if (url === 'https://api-demo.helloextend.com/stores/123456789O12/products') {
        response.text = JSON.stringify(responseDataMock.productsResponseMock);
    } else if (url === 'https://api-demo.helloextend.com/stores/123456789O12/contracts/123456/refund') {
        response.text = JSON.stringify(responseDataMock.refundsResponseMock);
    } else if (url === 'https://api-demo.helloextend.com/undefined') {
        response.text = JSON.stringify(responseDataMock.responseErrorMock);
    } else if (url === 'https://api-demo.helloextend.com/stores/123456789O12/contracts/undefined/refund') {
        response.text = JSON.stringify(responseDataMock.responseErrorNoResultsMock);
    }
    return response
}

class LocalServiceRegistry {

    createService(serviceId, configObj) {
        var service = new Service(serviceId);

        return {
            call: function (requestBody) {
                configObj.createRequest(service, requestBody);
                configObj.filterLogMessage();
                configObj.getRequestLogMessage();

                var response = getResponse(service.url);
                var parsedResponse = configObj.parseResponse(service, response);

                configObj.getResponseLogMessage();
                configObj.mockFull();

                if (service.url !== 'https://api-demo.helloextend.com/undefined') {
                    configObj.getResponseLogMessage();
                    configObj.mockFull();
                }

                return parsedResponse
            },
            getConfiguration: function () {
                return function getCredential() {
                    return {
                        getPassword: function () { return '1111'; },
                        getUser: function () { return 'Test'; }
                    }
                }
            },
            getURL: function () {
                return 'https://api-demo.helloextend.com';
            }
        };
    }
}

module.exports = new LocalServiceRegistry;
