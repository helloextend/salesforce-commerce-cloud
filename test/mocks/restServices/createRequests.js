'use strict';

var responseDataMock = require('./responseDataMock')

class WebService {
    createContractRequest(paramData) {
        if (paramData.custom.plan && paramData.custom.product.referenceId === "SKU-123-456") {
            return responseDataMock.createContractResponseSuccessMock;
        } else if (paramData.custom.product.referenceId !== "SKU-123-456") {
            return responseDataMock.responseErrorNoResultsMock;
        } 
            return responseDataMock.responseErrorMock;
 
    }

    getOfferRequest(paramData) {
        if (paramData && paramData === '1234567') {
            return responseDataMock.getOfferResponseSuccessMock;
        } else if (paramData && paramData !== '1234567') {
            return responseDataMock.responseErrorNoResultsMock;
        }
        return responseDataMock.responseErrorMock;
    }

    createProductRequest(paramData) {
        if (paramData[0].ID === '1234567') {
            return responseDataMock.createProductResponseSuccessMock;
        } else if (paramData[0].variationModel) {
            return responseDataMock.responseErrorNoResultsMock;
        }
        return responseDataMock.responseErrorMock;
    }
}

module.exports = new WebService();