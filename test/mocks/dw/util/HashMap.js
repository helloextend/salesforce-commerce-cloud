class HashMap {
    put(key, value) {
        this[key] = value;
    }

    get(product) {
        return {
            valueOrNull: product.price
        }
    }

    entrySet() {
        return [{
            key: 'key',
            value: 'value'
        }]
    }

}

module.exports = HashMap;