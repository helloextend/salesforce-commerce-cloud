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
    emarsysSmartInsightIMPEXFolder: 'smartinsight',
    emarsysPredictLocCurMap:'{"default":"USD", "en_US":"USD", "en":"USD"}',
    emarsysSingleChoiceValueMapping: JSON.stringify({
            "5":  [{"value":"1","choice":"Male"},{"value":"2","choice":"Female"}],
            "31": [{"value": "1","choice": "True"},{"value": "2","choice": "False"}],
            "35": [{"value": "2","choice": "German"},{"value": "1","choice": "English"},{"value": "3","choice": "French"}],
            "45": [{"value": "10", "choice": "Austria"}, {"value": "65", "choice": "Germany"},
                    {"value": "168", "choice": "Switzerland"}, {"value": "53", "choice": "Egypt"},
                    {"value": "54", "choice": "El Salvador"}, {"value": "103", "choice": "Macedonia"},
                    {"value": "104", "choice": "Madagascar"}, {"value": "170", "choice": "Taiwan"},
                {"value": "196", "choice": "Zambia"}, {"value": "197", "choice": "Zimbabwe"}],
            "98": [{"value": "1", "choice":"color"}]
        }),
    emarsysFileNameString: 'initial_2020',
    emarsysGetProfileFieldsLanguage: 'en',
    emarsysUseGrossPrice: false,
    emarsysEnabled: true,
    emarsysPredictVariationAttributes:['product.custom.color', 'product.custom.size']
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
                emarsysContactFieldsMap : JSON.stringify({ 
                    '1':'firstName', 
                    '2':'lastName', 
                    '3':'emailAddress', 
                    '4':'birthday',
                    '5':'gender',
                    '10':'address1',
                    '11':'city',
                    '12':'stateCode',
                    '13':'postalCode',
                    '14':'countryCode',
                    '15':'phone',
                    '17':'jobTitle',
                    '18':'companyName',
                    '46':'salutation'
                }),
                emarsysAddressFieldsMap : JSON.stringify({
                    '1': {
                        '1_1': 'firstName',
                        '2_1': 'lastName',
                        '3_1': 'emailAddress',
                        '10_1': 'address1',
                        '11_1': 'city',
                        '12_1': 'stateCode',
                        '13_1': 'postalCode',
                        '14_1': 'countryCode',
                        '15_1': 'phone',
                        '18_1': 'companyName'
                    },
                    '2': {
                        '1_2': 'firstName',
                        '2_2': 'lastName',
                        '3_2': 'emailAddress',
                        '10_2': 'address1',
                        '11_2': 'city',
                        '12_2': 'stateCode',
                        '13_2': 'postalCode',
                        '14_2': 'countryCode',
                        '15_2': 'phone',
                        '18_2': 'companyName'
                    }
                }),
                emarsysCountryCodes: JSON.stringify({'us': 185,'uk': 184,'de': 65,'fr': 61}),
                emarsysGenderCodes: JSON.stringify({'male': 1,'female': 2}),
                emarsysProductImageSize:'small',
                emarsysSFTPHost: 'test.emarsys.net',
                emarsysSFTPUsername: 'Test',
                emarsysSFTPPassword: 'test1234',
                emarsysSourceID: '34967',
                emarsysPredictEnableJSTrackingCode: true,
                emarsysLanguage:'en',
                emarsysSourceName: 'ofs-test2',
                emarsysAsList: true,
                emarsysNewsletter: false,
                emarsysSkipEmpty: false,
                emarsysUpdateOnly: false,
                emarsysAutoImportEnabled: true,
                emarsysOverwriteContacts: true,
                extendGlobalSwitch: true
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
                        'emarsysPredictEnableJSTrackingCode': true,
                        'emarsysPredictPDPRecommendationType': {
                            value: 'PERSONAL'
                        },
                        'emarsysPredictSearchPageRecommendationType':{
                            value: 'PERSONAL'
                        },
                        'emarsysPredictCategoryPageRecommendationType':{
                            value: 'PERSONAL'
                        },
                        'emarsysPredictThankYouForOrderPageRecommendationType':{
                            value: 'PERSONAL'
                        },
                        'emarsysPredictCartPageRecommendationType':{
                            value: 'PERSONAL'
                        },
                        'emarsysPredictHomePageRecommendationType':{
                            value: 'PERSONAL'
                        },
                        'emarsysPredictMerchantID' : '1273D0A7ACB7A11D'
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
    current: getCurrent()
};
