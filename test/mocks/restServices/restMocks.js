'use strict';

/**
 * Mock response object for products service call
 */
var productsResponseMock = JSON.stringify({
    action: 'Extend-Test',
    queryString: '',
    locale: 'en_US',
    added: [

    ],
    conflicts: [

    ],
    updated: [
        {
            parentReferenceId: 'id9',
            createdAt: 1574771568,
            brand: 'brand9',
            storeId: 'aff7dfea-fc04-4e41-a5db-64c389b9ecab',
            enabled: false,
            approved: false,
            imageUrl: 'https://www.google.com/',
            updatedAt: 1574771568,
            identifiers: {
                upc: '9001',
                gtin: '9000',
                asin: '9002',
                sku: 'test9',
                barcode: '9003'
            },
            category: 'category9',
            mfrWarranty: {
                parts: 12,
                url: 'http://example.com',
                labor: 12
            },
            description: 'description9',
            price: 100,
            title: 'Produc9',
            referenceId: 'id9',
            plans: [

            ]
        },
        {
            parentReferenceId: 'id10',
            createdAt: 1574771568,
            brand: 'brand7',
            storeId: 'aff7dfea-fc04-4e41-a5db-64c389b9ecab',
            enabled: false,
            approved: false,
            imageUrl: 'https://www.google.com/',
            updatedAt: 1574771568,
            identifiers: {
                upc: '10001',
                gtin: '10000',
                asin: '10002',
                sku: 'test10',
                barcode: '10003'
            },
            category: 'category7',
            mfrWarranty: {
                parts: 14,
                url: 'http://example.com',
                labor: 14
            },
            description: 'description7',
            price: 200,
            title: 'Produc10',
            referenceId: 'id10',
            plans: [

            ]
        }
    ],
    errors: [

    ]
});

/**
 * Mock response object for contracts service call
 */
var contractsResponseMock = JSON.stringify({
    id: 'cc957cb3-3d5d-430b-90a2-9ec96ee4c3cf',
    sellerId: 'bb123cb3-5f5d-999b-87a2-7yy88ee4c4tz',
    sellerName: 'Acme Corp',
    createdAt: 1557267465,
    updatedAt: 1557267556,
    transactionId: '99999999',
    poNumber: 'ABC-123',
    transactionTotal: 14999,
    customer: {
        phone: '123-456-7890',
        email: 'BobRoss@gmail.com',
        name: 'Bob Ross',
        address: {
            address1: '535 Mission Street',
            address2: '11th Floor',
            city: 'San Francisco',
            countryCode: 'USA',
            postalCode: '94526',
            provinceCode: 'CA'
        }
    },
    product: {
        referenceId: 'SKU-123-456',
        purchasePrice: 14999,
        manufacturerWarrantyLength: 12,
        manufacturerWarrantyLengthParts: 123456,
        manufacturerWarrantyLengthLabor: 123456,
        serialNumber: 'ABCD123456'
    },
    currency: 'USD',
    transactionDate: 1563388069,
    plan: {
        purchasePrice: 499,
        planId: '10001-misc-elec-adh-replace-1y'
    },
    status: 'live'
});

/**
 * Mock response object for offers service call
 */
var offersResponseMock = JSON.stringify({
    plans: [
        {
            id: 'AmazingAppliancePlan',
            price: 199,
            contract: {
                coverage_starts: 'immediate',
                coverage_includes: 'adh',
                service_type: 'replace',
                replacement_type: 'new',
                deductible: 0,
                term_length: 36
            },
            url: 'string'
        }
    ]
});

var refundsResponseMock = JSON.stringify({
    id: "cc957cb3-3d5d-430b-90a2-9ec96ee4c3cf",
    createdAt: 1557267465,
    updatedAt: 1557267556,
    transactionId: "99999999",
    poNumber: "ABC-123",
    transactionTotal: {
        currencyCode: "USD",
        amount: 1999
    },
    customer: {
        name: "Bob Ross",
        email: "BobRoss@gmail.com",
        phone: "123-456-7890",
        billingAddress: {
            address1: "535 Mission Street",
            address2: "11th Floor",
            city: "San Francisco",
            countryCode: "US",
            postalCode: "94526",
            provinceCode: "CA"
        },
        shippingAddress: {
            address1: "535 Mission Street",
            address2: "11th Floor",
            city: "San Francisco",
            countryCode: "US",
            postalCode: "94526",
            provinceCode: "CA"
        }
    },
    product: {
        referenceId: "SKU-123-456",
        purchasePrice: {
            currencyCode: "USD",
            amount: 1999
        },
        manufacturerWarrantyLength: 12,
        manufacturerWarrantyLengthParts: 123456,
        manufacturerWarrantyLengthLabor: 123456,
        serialNumber: "ABCD123456"
    },
    currency: "USD",
    transactionDate: 1563388069,
    plan: {
        purchasePrice: {
            currencyCode: "USD",
            amount: 1999
        },
        planId: "10001-misc-elec-adh-replace-1y"
    },
    refundAmount: {
        currencyCode: "USD",
        amount: 1999
    }
});

/** Exports mocks objects */
module.exports = {
    productsResponseMock: productsResponseMock,
    contractsResponseMock: contractsResponseMock,
    offersResponseMock: offersResponseMock,
    refundsResponseMock: refundsResponseMock
};