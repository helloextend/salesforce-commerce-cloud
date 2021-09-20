var I = actor();

module.exports = {
    locators: {
        keyTab: 'Tab',
        keyEnter: 'Enter',
        productInfo: '.card.product-info',
        removeProductBox: '.hidden-md-down',
        removeProductBtn: '.remove-btn-lg.remove-product.btn.btn-light',
        removeProductModal: '.modal-content',
        removeProductModalConfirm: '.btn.btn-primary.cart-delete-confirmation-btn',
        editQuantitySelector: '.form-control.quantity.custom-select',
        offersContainer: '.offers-container',
        offerBtn: '.btn-offer',
        submitOfferBtn: '.button-submit',
        addWarrantyBtn: '.simple-offer'
    },
    removeProduct(productName) {
        // Click x to remove product
        let locator = locate(this.locators.removeProductBox)
            .find(this.locators.removeProductBtn)
            .withAttr({ 'data-name': productName });
        I.waitForElement(locator);
        I.click(locator);
        // Confirm remove product
        I.waitForElement(this.locators.removeProductModal);
        within(this.locators.removeProductModal, () => {
            I.waitForElement(this.locators.removeProductModalConfirm);
            I.wait(1);
            I.click(this.locators.removeProductModalConfirm);
        });
    },
    selectAddProtectionButton() {
        I.wait(2);
        I.click(this.locators.productInfo);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyTab);
        I.pressKey(this.locators.keyEnter);
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
    addWarranty() {
        this.selectAddProtectionButton();
        this.selectProtectionPlan();
        this.addProtectionPlan();
        I.wait(1);
    }
};
