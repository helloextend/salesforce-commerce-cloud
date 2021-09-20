var I = actor();

module.exports = {
    locators: {
        keyTab: 'Tab',
        keyEnter: 'Enter',
        consentTrackModal: '.modal-content',
        consentTrackAffirm: '.affirm.btn.btn-primary',
        button: 'button',
        selectSize: '.select-size',
        selectQuantity: '.quantity-select',
        addToCartButton: '.add-to-cart',
        qv_offersDiv: '.extend-product-offer',
        minicart: '.minicart-link'
    },
    accept() {
        within(this.locators.consentTrackModal, () => {
            I.click(this.locators.consentTrackAffirm);
        });
        I.wait(1);
    },
    selectColor(color) {
        I.refreshPage();
        let locator = locate(this.locators.button)
            .withAttr({'aria-label': 'Select Color ' + color});
        I.click(locator);
        I.wait(1);
    },
    selectSize(label, size) {
        I.selectOption(label, size);
        I.wait(1);
    },
    selectQuantity(quantity) {
        I.wait(1);
        I.waitForElement(this.locators.selectQuantity);
        I.selectOption(this.locators.selectQuantity, quantity);
        I.wait(1);
        I.waitForElement(this.locators.qv_offersDiv);
    },
    addWarranty() {
        I.scrollTo(this.locators.qv_offersDiv);
        let locator = locate('iframe')
            .withAttr({'style': 'width: 100%; border: none; display: block; overflow: hidden; height: 78px;'});
        I.wait(1);
        I.waitForElement(locator);
        I.click(locator);
        I.wait(1);
    },
    selectProtectionPlan() {
        I.wait(0.5);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyEnter);
    },
    addProtectionPlan() {
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyEnter);
    },
    addWarrantyByPopUp() {
        this.selectProtectionPlan();
        this.addProtectionPlan();
        I.wait(1);
    },
    addToCart() {
        I.scrollTo(this.locators.addToCartButton);
        I.waitForEnabled(this.locators.addToCartButton);
        I.click(this.locators.addToCartButton);
        I.wait(1);
    },
    // skip all protection plan and choose button "No, thanks"
    addProductWithoutWarranty() {
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyEnter);
        I.wait(1);
    },
    goToCart() {
        I.scrollTo(this.locators.minicart);
        I.wait(1);
        I.click(this.locators.minicart);
        I.wait(1);
    }
};
