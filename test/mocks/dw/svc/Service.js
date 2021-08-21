'use strict';

function getServiceData(id) {
    if (id === 'int_extend.http.Extend') {
        return {
            profile: {
                Name: id
            },
            credential: {
                Name: id,
                URL: 'https://api-demo.helloextend.com/'
            }
        }
    }
}

class Service {
    constructor(id) {
        this.ID = id;
        this.headers = {};
        this.params = {};
        this.configuration = getServiceData(id);
    }

    addHeader(name, value) {
        this.headers[name] = value;
    }

    setRequestMethod(method) {
        this.method = method;
    }

    setURL(url) {
        this.url = url;
    }

    addParam(name, value) {
        this.params[name] = value;
    }
}

module.exports = Service;
