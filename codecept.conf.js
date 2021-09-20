var debug = require('debug')('acceptance:config');
let merge = require('deepmerge');
let codeceptjsShared = require('codeceptjs-shared');
let codeceptJsSauce = require('codeceptjs-saucelabs');
var cwd = process.cwd();
var path = require('path');
var fs = require('fs');

var metadata = require('./test/acceptance/metadata.json');

var RELATIVE_PATH = './test/acceptance';
var OUTPUT_PATH = RELATIVE_PATH + '/report';

function getDwJson() {
    if (fs.existsSync(path.join(cwd, 'dw.json'))) {
        return require(path.join(cwd, 'dw.json'));
    }
    return {};
}

var SAUCE_USER = getDwJson().username || process.env.SAUCE_USERNAME;
var SAUCE_KEY = getDwJson().password || process.env.SAUCE_KEY;

var DEFAULT_HOST = 'https://' + getDwJson().hostname;
var HOST = DEFAULT_HOST || process.env.HOST;

// Here is where you can target specific browsers/configuration to run on sauce labs.
var userSpecificBrowsers = {
    phone: {
        browser: 'chrome',
        desiredCapabilities: {
            chromeOptions: {
                mobileEmulation: {
                    deviceName: "iPhone X"
                }
            }
        }
    },
    tablet: {
        browser: 'chrome',
        desiredCapabilities: {
            chromeOptions: {
              mobileEmulation: {
                deviceName: "Kindle Fire HDX"
              }
            }
          }
    }
}

let conf = {
    output: OUTPUT_PATH,
    cleanup: true,
    coloredLogs: true,
    helpers: {
        REST: {},
        WebDriver: {
            url: HOST,
            waitForTimeout: 10000
        }
    },
    plugins: {
        wdio: {
            enabled: true,
            services: ['selenium-standalone']
        },
        retryFailedStep: {
            enabled: true,
            retries: 3
        }
    },
    include: metadata.include,
    gherkin: {
        features: RELATIVE_PATH + '/features/**/*.feature',
        steps: metadata.gherkin_steps
    },
    name: 'storefront-reference-architecture'
};

exports.config = merge(merge(conf, codeceptjsShared.config.master), codeceptJsSauce.config.saucelabs(SAUCE_USER, SAUCE_KEY, userSpecificBrowsers));