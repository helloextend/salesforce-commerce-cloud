class HashMap {
    constructor() {

    }

    put(key, value) {
        this[key] = value;
    }

    get(product) {
        return {
            valueOrNull: product.price
        }
    }
}

module.exports = HashMap;