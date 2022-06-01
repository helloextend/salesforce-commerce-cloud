'use strict';
// Helper Functions

// Used to map Value with DisplayValue
function SetOfString(value, displayValue) {
    return {
        value: value,
        displayValue: displayValue,
        getValue: () => {
            return value;
        },
        getDisplayValue: () => {
            return displayValue;
        }
    };
}

// Site Preferences Map
var preferenceMap = {
    countryCode: new SetOfString('US', 'USA'),
    'emarsysCountryCodes': JSON.stringify({'us': 185,'uk': 184,'de': 65,'fr': 61}),
    'emarsysGenderCodes': JSON.stringify({'male': 1,'female': 2}),
    allowedLocales: [{
        id: 'en_US',
        currencyCode: 'USD'
    }, {
        id: 'fr_CA',
        currencyCode: 'CAD'
    }, {
        id: 'en_CA',
        currencyCode: 'CAD'
    }],
    QAS_EnableAddressVerification: true,
    testString: 'test',
    testJson: '{"test": 1}',
    Paymetric_iframeURL: 'test',
    Paymetric_clientPath: 'test',
    sitesListBasic: '[{ "countryCode": "BE", "siteID": "PJG-BE", "locales": ["en_BE"], "currencyCode": "EUR" }, { "countryCode": "DE", "siteID": "PJG-DE", "locales": ["de_DE"], "currencyCode": "EUR" }]',
    extendStoreID: '123456789O12',
    extendGlobalSwitch: true,
    extendImageViewType: 'large',
};


// Current Site methods, dw.system.Site methods
function getCurrent() {
    return {
        // Access preferences by key/ID
        getCustomPreferenceValue: function(key) {
            return preferenceMap[key];
        },
       // getCustomPreferenceValue: getCustomPreferenceValue,
        getDefaultCurrency: function () {
            return 'USD';
        },
        getDefaultLocale: function() {
            return 'en_US';
        },
        preferences : {
            custom : {
                extendGlobalSwitch: true,
                extendImageViewType: 'large'
            }
        },
        defaultCurrency : 'USD',
        emarsysUseGrossPrice: true,
        getID : function() {
            return 'siteName';
        },
        ID: '1234567890',
        getPreferences: function () {
            return {
                getCustom: function () {
                    return {
                        'extendGlobalSwitch': true,
                        'extendImageViewType': 'large'
                    };
            }};
        },
        getAllowedLocales: function () {
            return ['en_US','it_IT','de_DE'];
        },
        setCustomPreferenceValue: function(name, value) {
            return {name: value};
        }
    };
}

module.exports = {
    getCurrent: getCurrent,
    current: getCurrent(),
    preferenceMap: preferenceMap
};
