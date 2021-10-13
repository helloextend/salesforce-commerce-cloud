'use strict';

var Collection = require('./../util/Collection');
var SeekableIterator = require('./../util/SeekableIterator');

var objects = {
    'ExtendContractsQueue': {
        'customConfig': {
            custom: {
                orderNo: '345021307483&',
                orderTotal: 30000,
                currency: 'USD',
                plan: {
                    planId:'10001-misc-elec-adh-replace-1y',
                    purchasePrice: 499,
                },
                product: {
                    referenceId: "SKU-123-456",
                    purchasePrice: 14999,
                    serialNumber: "ABCD123456"
                },
                customer: {
                    phone: '123-456-7890',
                    email: 'myemail@gmail.com',
                    name: 'John Doe',
                    address: {
                        address1: '535 Mission Street',
                        address2: "11th Floor",
                        city: 'Nevercity',
                        countryCode: "US",
                        postalCode: "94526",
                        provinceCode: "CA"
                    }
                },
                LIUUID: '24851-25134'
            }
        },
        'customConfig2': {
            custom: {
                orderNo: '345021307483&',
                orderTotal: 30000,
                currency: 'USD',
                plan: {
                    planId:'10001-misc-elec-adh-replace-1y',
                    purchasePrice: 499,
                },
                product: {
                    referenceId: "SKU-123-456",
                    purchasePrice: 14999,
                    serialNumber: "ABCD123456"
                },
                customer: {
                    phone: '123-456-7890',
                    email: 'myemail@gmail.com',
                    name: 'John Doe',
                    address: {
                        address1: '535 Mission Street',
                        address2: "11th Floor",
                        city: 'Nevercity',
                        countryCode: "US",
                        postalCode: "94526",
                        provinceCode: "CA"
                    }
                },
                LIUUID: '24751-25634'
            }
        },
        'customConfig3': {
            custom: {
                orderTotal: 30000,
                currency: 'USD',
                plan: {
                    planId:'10001-misc-elec-adh-replace-1y',
                    purchasePrice: 499,
                },
                product: {
                    referenceId: "SKU-123-456",
                    purchasePrice: 14999,
                    serialNumber: "ABCD123456"
                },
                customer: {
                    phone: '123-456-7890',
                    email: 'myemail@gmail.com',
                    name: 'John Doe',
                    address: {
                        address1: '535 Mission Street',
                        address2: "11th Floor",
                        city: 'Nevercity',
                        countryCode: "US",
                        postalCode: "94526",
                        provinceCode: "CA"
                    }
                },
                LIUUID: '24751-25634'
            }
        },
        'customConfigWrong': {
            custom: {
                orderNo: '345021307483&',
                orderTotal: 30000,
                currency: 'USD',
                plan: null,
                product: {
                    referenceId: "SKU-123-456",
                    purchasePrice: 14999,
                    serialNumber: "ABCD123456"
                },
                customer: {
                    phone: '123-456-7890',
                    email: 'myemail@gmail.com',
                    name: 'John Doe',
                    address: {
                        address1: '535 Mission Street',
                        address2: "11th Floor",
                        city: 'Nevercity',
                        countryCode: "US",
                        postalCode: "94526",
                        provinceCode: "CA"
                    }
                }
            }
        },
        'customConfigMissed': {
            custom: {
                orderNo: '345021307483&',
                orderTotal: 30000,
                currency: 'USD',
                plan: {
                    planId:'10001-misc-elec-adh-replace-1y',
                    purchasePrice: 499,
                },
                product: {
                    referenceId: "SKU-123-111",
                    purchasePrice: 14999,
                    serialNumber: "ABCD123111"
                },
                customer: {
                    phone: '123-456-7890',
                    email: 'myemail@gmail.com',
                    name: 'John Doe',
                    address: {
                        address1: '535 Mission Street',
                        address2: "11th Floor",
                        city: 'Nevercity',
                        countryCode: "US",
                        postalCode: "94526",
                        provinceCode: "CA"
                    }
                }
            }
        },
        'customConfigReq': {
            custom: {
                'orderNo': '345021307483&',
                'orderTotal': 30000,
                'currency': 'USD',
                'plan': JSON.stringify({
                    "planId":'10001-misc-elec-adh-replace-1y',
                    "purchasePrice": 499,
                }),
                'product': JSON.stringify({
                    'referenceId': "SKU-123-456",
                    'purchasePrice': 14999,
                    'serialNumber': "ABCD123456"
                }),
                'customer': JSON.stringify({
                    'phone': '123-456-7890',
                    'email': 'myemail@gmail.com',
                    'name': 'John Doe',
                    'address': {
                        'address1': '535 Mission Street',
                        'address2': "11th Floor",
                        'city': 'Nevercity',
                        'countryCode': "US",
                        'postalCode': "94526",
                        'provinceCode': "CA"
                    }
                })
            },
            getCreationDate() {
                return {
                    date: Date.now(),
                    valueOf: function () {
                        return this.date;
                    }
                }
            }
        },
    }
}

class CustomObjectMgr {
    createCustomObject(type, key) {
        var newObject = objects[type][key];

        return newObject;
    }

    getCustomObject(type, key) {
        var creator = objects[type];
        var newObject = creator[key];
        return newObject;
    }

    queryCustomObjects(type) {
        var index = 0;
        return {
            items: items,
            iterator: function () {
                return {
                    items: items,
                    hasNext: function () {
                        return index < items.length;
                    },
                    next: function () {
                        return items[index++];
                    }
                };
            },
            toArray: function () {
                return items;
            },
            next: function () {
                return items[index++];
            },
            hasNext: function () {
                return index < items.length;
            }
        };
    }

    getAllCustomObjects(type) {
        return new SeekableIterator([
            objects[type]['customConfig'],
            objects[type]['customConfigWrong'],
            objects[type]['customConfigMissed'],
            objects[type]['customConfigReq'],
            objects[type]['customConfig2'],
            objects[type]['customConfig3'],
        ])
    }

    remove() {
        return true;
    }
}

module.exports = new CustomObjectMgr;

