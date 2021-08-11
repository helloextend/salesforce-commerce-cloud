'use strict';

class LocalServiceRegistry {
    createService(serviceId, configObj) {
        if (configObj && configObj.createRequest) {
            configObj.createRequest();
        }
        return {
            call: function (requestBody) {
                switch (requestBody) {
                    default:
                        return {
                            status: 'OK',
                            object: JSON.stringify({ data: [] })
                        }
                }
            },
            getConfiguration: function () {
                return function getCredential() {
                    return {
                        getPassword: function () { return '1111'; },
                        getUser: function () { return 'Test'; }
                    }
                }
            },
            getURL: function () {
                return 'https://api-demo.helloextend.com';
            }
        };
    }
}

module.exports = new LocalServiceRegistry;
