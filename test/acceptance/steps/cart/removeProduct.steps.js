var { I, data, productDetailPage, cart } = inject();

When('Shopper searches for "Long Sleeve Ruffle Front Cardigan"', () => {
    I.amOnPage(data.pages.pdpPage);
    productDetailPage.accept();
});

Then('Shopper selects color', () => {
    productDetailPage.selectColor(data.extend.color);
});

Then('Shopper selects size', () => {
    productDetailPage.selectSize(data.extend.size.label, data.extend.size.value);
});

Then('Shopper selects quantity', () => {
    productDetailPage.selectQuantity(data.extend.quantity);
});

Then('Shooper adds product to cart', () => {
    productDetailPage.addToCart();
});

Then('Shooper rejects the purchase of warranty', () => {
    productDetailPage.addProductWithoutWarranty();
});

Then('Shooper goes to cart', () => {
    productDetailPage.goToCart();
});

Then('Shooper adds extend within cart', () => {
    cart.addWarranty();
});

Then('Shooper removes product', () => {
    cart.removeProduct(data.extend.name);
})
