'use strict';

var createContractResponseSuccessMock = {
    'error': 0,
    'errorMessage': null,
    'object': {
        'id': 'cc957cb3-3d5d-430b-90a2-9ec96ee4c3cf',
        'createdAt': 1557267465,
        'updatedAt': 1557267556,
        'transactionId': '99999999',
        'poNumber': 'ABC-123',
        'transactionTotal': 30000,
        'customer': {
            'phone': '123-456-7890',
            'email': 'myemail@gmail.com',
            'name': 'John Doe',
            'address': {
                'address1': '535 Mission Street',
                'address2': '11th Floor',
                'city': 'Nevercity',
                'countryCode': 'US',
                'postalCode': '94526',
                'provinceCode': 'CA'
            }
        },
        'product': {
            'referenceId': 'SKU-123-456',
            'purchasePrice': 14999,
            'manufacturerWarrantyLength': 12,
            'manufacturerWarrantyLengthParts': 12,
            'manufacturerWarrantyLengthLabor': 12,
            'serialNumber': 'ABCD123456'
        },
        'currency': 'USD',
        'transactionDate': 1563388069,
        'plan': {
            'purchasePrice': 499,
            'planId': '10001-misc-elec-adh-replace-1y'
        }
    },
    'ok': true,
    'status': 'SUCCESS'
};

var getOfferResponseSuccessMock = {
    'error': 0,
    'errorMessage': null,
    'object': {
        'plans': [
            {
                'id': 'AmazingAppliancePlan',
                'price': 199,
                'currencyCode': 'USD',
                'contract': {
                    'coverage_starts': 'immediate',
                    'coverage_includes': 'adh',
                    'service_type': 'replace',
                    'replacement_type': 'new',
                    'deductible': 0,
                    'term_length': 36
                },
                'imageUrl': 'https://sdk.helloextend.com/extend_icon.png',
                'title': 'Extend Protection Plan - AV Receiver',
                'url': 'string'
            }
        ]
    },
    'ok': true,
    'status': 'SUCCESS'
};

var createProductResponseSuccessMock = {
    'error': 0,
    'errorMessage': null,
    'object': {
        'added': [{
            'brand': 'ACME',
            'category': 'sports',
            'createdAt': 1557267465,
            'description': 'One Dozen. Tickle your friends! Suprise your opponent!',
            'enabled': true,
            'imageUrl': 'https://bit.ly/2VN88Jf',
            'mfrWarranty': {
                'parts': 12,
                'labor': 12,
                'url': 'http://example.com'
            },
            'price': 2599,
            'title': 'Explosive Tennis Balls',
            'updatedAt': 1557267465,
            'status': 'new',
            'referenceId': '2324f800-7575-4c65-bd2c-588c89e8ab7f',
            'parentReferenceId': '2324f800-7575-4c65-bd2c-588c89e8ab7f',
            'identifiers': {
                'sku': 'KS944RUR',
                'gtin': '012345678901234',
                'upc': '0123456789012',
                'asin': '0123456789',
                'barcode': '123'
            }
        }],
        'conflicts': [],
        'errors': [],
        'retryables': [],
        'updated': []
    },
    'ok': true,
    'status': 'SUCCESS'
};

var responseCreateRefundSuccessMock = {
    'error': 0,
    'errorMessage': null,
    'object': {
        'id': 'cc957cb3-3d5d-430b-90a2-9ec96ee4c3cf',
        'createdAt': 1557267465,
        'updatedAt': 1557267556,
        'transactionId': '99999999',
        'poNumber': 'ABC-123',
        'transactionTotal': {
            'currencyCode': 'USD',
            'amount': 1999
        },
        'customer': {
            'name': 'Bob Ross',
            'email': 'BobRoss@gmail.com',
            'phone': '123-456-7890',
            'billingAddress': {
                'address1': '535 Mission Street',
                'address2': '11th Floor',
                'city': 'San Francisco',
                'countryCode': 'US',
                'postalCode': '94526',
                'provinceCode': 'CA'
            },
            'shippingAddress': {
                'address1': '535 Mission Street',
                'address2': '11th Floor',
                'city': 'San Francisco',
                'countryCode': 'US',
                'postalCode': '94526',
                'provinceCode': 'CA'
            }
        },
        'product': {
            'referenceId': 'SKU-123-456',
            'purchasePrice': {
                'currencyCode': 'USD',
                'amount': 1999
            },
            'manufacturerWarrantyLength': 12,
            'manufacturerWarrantyLengthParts': 123456,
            'manufacturerWarrantyLengthLabor': 123456,
            'serialNumber': 'ABCD123456'
        },
        'currency': 'USD',
        'source': {
            'agentId': 'partner1234',
            'channel': 'web',
            'integratorId': 'netsuite',
            'locationId': 'store573',
            'platform': 'magento'
        },
        'transactionDate': 1563388069,
        'plan': {
            'purchasePrice': {
                'currencyCode': 'USD',
                'amount': 1999
            },
            'planId': '10001-misc-elec-adh-replace-1y'
        },
        'terms': {
            'termsId': '154ebea0-6c1b-46a4-b166-032246330526',
            'version': '1'
        },
        'isTest': false,
        'refundAmount': {
            'currencyCode': 'USD',
            'amount': 1999
        }
    },
    'ok': true,
    'status': 'SUCCESS'
};

var responseErrorMock = {
    'error': 400,
    'errorMessage': 'Error',
    'object': null,
    'ok': false,
    'status': 'ERROR'
};

var responseErrorNoResultsMock = {
    'error': 400,
    'errorMessage': null,
    'object': null,
    'ok': false,
    'status': 'ERROR'
};

module.exports = {
    createContractResponseSuccessMock: createContractResponseSuccessMock,
    getOfferResponseSuccessMock: getOfferResponseSuccessMock,
    createProductResponseSuccessMock: createProductResponseSuccessMock,
    responseErrorMock: responseErrorMock,
    responseErrorNoResultsMock: responseErrorNoResultsMock,
    responseCreateRefundSuccessMock: responseCreateRefundSuccessMock
};
