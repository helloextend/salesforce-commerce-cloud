'use strict';

var Product = require('./../dw/catalog/Product');
var ProductLineItem = require('./../dw/order/ProductLineItem');
var CustomObjectMgr = require('./../dw/object/CustomObjectMgr');

var ContractQueueObjects = CustomObjectMgr.getAllCustomObjects('ExtendContractsQueue').asList();

var contractMock = ContractQueueObjects.items[0];
var contractWrongMock = ContractQueueObjects.items[1];
var contractMissedMock = ContractQueueObjects.items[2];
var contractReqData = ContractQueueObjects.items[3];

var getOfferMock = '1234567';
var getOfferWrongMock = '';
var getOfferMissedMock = '999987';

var productMock = [new Product()];
var productNoCategoryMock = [new Product({noCategory: true})];
var productMasterMock = [new Product({master:true})];
var productMasterNoCategoryMock = [new Product({noCategory: true, master:true})];
var productWrongMock = [new ProductLineItem()];
var productMissedMock = [new Product({ID: '987654'})];

module.exports = {
    contractMock: contractMock,
    contractWrongMock: contractWrongMock,
    contractMissedMock: contractMissedMock,
    contractReqData: contractReqData,
    getOfferMock: getOfferMock,
    getOfferWrongMock: getOfferWrongMock,
    getOfferMissedMock: getOfferMissedMock,
    productMock: productMock,
    productMasterMock: productMasterMock,
    productNoCategoryMock: productNoCategoryMock,
    productMasterNoCategoryMock: productMasterNoCategoryMock,
    productWrongMock: productWrongMock,
    productMissedMock: productMissedMock,
}
