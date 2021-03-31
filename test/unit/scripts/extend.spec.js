// Test helpers
const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

chai.use(require('sinon-chai'));

// Mocks
const restServiceMocks = require('../../mocks/restServiceMocks.js');

// Unit under test
const extend = proxyquire('../../../cartridges/int_extend_sfra/cartridge/scripts/extend', {
  './services/rest': {
    createContractRequest: () => {},
    getOfferRequest: () => {},
  },
});

describe('createContract', () => {

  before(() => {

  });

  after(() => {

  });

  beforeEach(() => {

  });

  afterEach(() => {

  });

  it('service response exists', () => {
    assert.isFunction(extend.createContract);
  })
});

describe('getOffer', () => {
  before(() => {

  });

  after(() => {

  });

  beforeEach(() => {

  });

  afterEach(() => {

  });

  it('service response exists', () => {
    assert.isFunction(extend.createContract);
  })
})