'use strict';

var responseDataMock = require('./responseDataMock')

class WebService {
    createContractRequest(paramData) {
        if (paramData.custom.plan && paramData.custom.product.referenceId === "SKU-123-456") {
            return responseDataMock.contractsResponseMock;
        } else if (paramData.custom.product.referenceId !== "SKU-123-456") {
            return responseDataMock.responseErrorNoResultsMock;
        }
        return responseDataMock.responseErrorMock;
    }

    getOfferRequest(paramData) {
        if (paramData && paramData === '1234567') {
            return responseDataMock.offersResponseMock;
        } else if (paramData && paramData !== '1234567') {
            return responseDataMock.responseErrorNoResultsMock;
        }
        return responseDataMock.responseErrorMock;
    }

    createProductRequest(paramData) {
        if (paramData.items[0].ID === '1234567') {
            return responseDataMock.productsResponseMock;
        } else if (paramData.items[0].variationModel) {
            return responseDataMock.responseErrorNoResultsMock;
        }
        return responseDataMock.responseErrorMock;
    }

    createContracts(paramData) {
        var response = this.createContractRequest(paramData);

        if (response.object) {
            return response.object;
        } else if (!response.errorMessage) {
            response.id = 'someId';
        }
        return response;
    }

    exportProducts(paramData) {
        var response = this.createProductRequest(paramData);
        return response;
    }
}

module.exports = new WebService();