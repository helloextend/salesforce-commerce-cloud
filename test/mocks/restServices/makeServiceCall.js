'use strict';

var responseDataMock = require('./responseDataMock')

class MakeServiceCall {
    makeServiceCall(endpoint, params) {
        var response;

        switch (endpoint) {
            case 'contracts':
                response = responseDataMock.contractsResponseMock;
                break;
            
            case 'products':
                response = responseDataMock.productsResponseMock;
                break;

            case 'refund': 
                response = responseDataMock.refundsResponseMock;

            default:
                break;
        }
        return response;
    }

}

module.exports = new MakeServiceCall();