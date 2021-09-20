'use strict';

var Master = require('./../dw/catalog/Master');
var Variant = require('./../dw/catalog/Variant');
var ProductLineItem = require('./../dw/order/ProductLineItem');
var CustomObjectMgr = require('./../dw/object/CustomObjectMgr');

var ContractQueueObjects = CustomObjectMgr.getAllCustomObjects('ExtendContractsQueue').asList();

//Mock objects for extend.js
var contractMock = ContractQueueObjects.items[0];
var contractWrongMock = ContractQueueObjects.items[1];
var contractMissedMock = ContractQueueObjects.items[2];

//Mock object for and rest.js
var contractReqData = ContractQueueObjects.items[3];

//Mock strings for extend.js
var getOfferMock = '1234567';
var getOfferWrongMock = '';
var getOfferMissedMock = '999987';

//Mock arrays for extend.js and rest.js
var productMock = [new Variant()];
var productWrongMock = [new ProductLineItem()];
var productMissedMock = [new Variant({ ID: '987654' })];

//Mock product without some data rest.js
var notAllDataProduct = new Variant();
notAllDataProduct.shortDescription = null;
notAllDataProduct.image.large = null;
notAllDataProduct.priceModel.price.available = false;

//Mock arrays for rest.js
var productsRestMock = [
    new Variant(), new Variant({ noCategory: true }), 
    new Master(), new Master({ noCategory: true }), 
    new ProductLineItem(), notAllDataProduct
];

var createRefundMock = {
    extendContractId: '123456789',
    commit: true
};
var createRefundWrongMock = {
    extendContractId: '',
    commit: true
};

var createMissedRefundMock = {
    extendContractId: '61234456',
    commit: true
};

module.exports = {
    contractMock: contractMock,
    contractWrongMock: contractWrongMock,
    contractMissedMock: contractMissedMock,
    contractReqData: contractReqData,
    getOfferMock: getOfferMock,
    getOfferWrongMock: getOfferWrongMock,
    getOfferMissedMock: getOfferMissedMock,
    productMock: productMock,
    productsRestMock: productsRestMock,
    productWrongMock: productWrongMock,
    productMissedMock: productMissedMock,
    createRefundMock: createRefundMock,
    createRefundWrongMock: createRefundWrongMock,
    createMissedRefundMock: createMissedRefundMock
}
