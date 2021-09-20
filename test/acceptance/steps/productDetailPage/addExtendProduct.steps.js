var { I, data, productDetailPage } = inject();

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

Then('Shooper chooses a plan', () => {
    productDetailPage.addWarranty();
});

Then('Shooper adds product to cart', () => {
    productDetailPage.addToCart();
});
