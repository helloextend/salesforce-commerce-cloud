'use strict';

const { param } = require('jquery');
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

    createRefundRequest(paramData) {
        if (!paramData.extendContractId) {
            return responseDataMock.responseErrorMock;
        } else if (paramData.extendContractId === '61234456') {
            return responseDataMock.responseErrorNoResultsMock;
        } else if (paramData.extendContractId === '123456789') {
            return responseDataMock.responseCreateRefundSuccessMock
        } else if (paramData.extendContractId === '6') {
            return {
                id: paramData.extendContractId,
                error: false,
                refundAmount: {
                    amount: 0
                }
            }
        } else if (paramData.extendContractId === '1') {
            return {
                id: paramData.extendContractId,
                error: false,
                refundAmount: {
                    amount: -10
                }
            }
        } else if (paramData.extendContractId === '3' && paramData.commit) {
            return {
                error: true
            }
        } else {
            return {
                id: paramData.extendContractId,
                error: false,
                refundAmount: {
                    amount: 10
                }
            }
        }
    }

    createContract(paramData) {
        var response = this.createContractRequest(paramData);

        if (response.object) {
            return response.object;
        } else if (!response.errorMessage) {
            response.id = 'someId';
        }
        return response;
    }

    createProduct(paramData) {
        var response = this.createProductRequest(paramData);
        return response;
    }

    createRefund(paramData) {
        var response = this.createRefundRequest(paramData);
        return response;
    }

}

module.exports = new WebService();