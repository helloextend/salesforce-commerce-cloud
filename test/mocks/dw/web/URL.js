class URL {
    constructor(arg) {
        for(var key in arg) {
            this[encodeURIComponent(key)] = encodeURIComponent(arg[key]);
        }
        this.stringValue = this.action + '/' + this.aName + '=' + this.aValue;
    }
    toString() {
        return this.stringValue;
    }
    append(key, val) {
        this.stringValue += /\?/.test(this.stringValue) ? '&' : '?';
        this.stringValue += encodeURIComponent(key) + '=' + encodeURIComponent(val);
        return this;
    }
}

module.exports = URL;