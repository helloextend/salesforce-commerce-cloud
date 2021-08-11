'use strict';

var Product = require('./../dw/catalog/Product');
var ProductLineItem = require('./../dw/order/ProductLineItem');
var CustomObjectMgr = require('./../dw/object/CustomObjectMgr');

var ContractQueueObjects = CustomObjectMgr.getAllCustomObjects('ExtendContractsQueue').asList();

var createContractParamMock = ContractQueueObjects.items[0];
var createContractWrongParamMock = ContractQueueObjects.items[1];
var createContractMissedParamMock = ContractQueueObjects.items[2];
var createContractReqData = ContractQueueObjects.items[3];

var getOfferParamMock = '1234567';
var getOfferWrongParamMock = '';
var getOfferMissedParamMock = '999987';

var createProductParamMock = [new Product()]
var createProductWrongParamMock = [new ProductLineItem()]
var createProductMissedParamMock = [new Product({ID: '987654'})]

module.exports = {
    createContractParamMock: createContractParamMock,
    createContractWrongParamMock: createContractWrongParamMock,
    createContractMissedParamMock: createContractMissedParamMock,
    getOfferParamMock: getOfferParamMock,
    getOfferWrongParamMock: getOfferWrongParamMock,
    getOfferMissedParamMock: getOfferMissedParamMock,
    createProductParamMock: createProductParamMock,
    createProductWrongParamMock: createProductWrongParamMock,
    createProductMissedParamMock: createProductMissedParamMock,
    createContractReqData: createContractReqData
}
