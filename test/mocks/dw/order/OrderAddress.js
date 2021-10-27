'use strict'

class OrderAddress {
    constructor() {
        this.firstName = 'Amanda';
        this.lastName = 'Jones';
        this.address1 = '65 May Lane';
        this.address2 = '';
        this.city = 'Allston';
        this.postalCode = '02135';
        this.countryCode = { value: 'us' };
        this.phone = '617-555-1234';
        this.stateCode = 'MA';
        
        Object.defineProperty(this, 'value', {
            value: this
        });
    }
    setFirstName (firstNameInput) { this.firstName = firstNameInput; }
    setLastName (lastNameInput) { this.lastName = lastNameInput; }
    setAddress1 (address1Input) { this.address1 = address1Input; }
    setAddress2 (address2Input) { this.address2 = address2Input; }
    setCity (cityInput) { this.city = cityInput; }
    setPostalCode (postalCodeInput) { this.postalCode = postalCodeInput; }
    setStateCode (stateCodeInput) { this.stateCode = stateCodeInput; }
    setCountryCode (countryCodeInput) { this.countryCode.value = countryCodeInput; }
    setPhone (phoneInput) { this.phone = phoneInput; }
}

module.exports = OrderAddress;