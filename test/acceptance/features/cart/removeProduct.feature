Feature: Remove product
    As a customer, I would like to remove product from cart

@cart
    Scenario: Shopper is able to add product without warranty
        When Shopper searches for "Long Sleeve Ruffle Front Cardigan"
        Then Shopper selects color
        Then Shopper selects size
        Then Shopper selects quantity
        Then Shooper adds product to cart
        Then Shooper rejects the purchase of warranty
        Then Shooper goes to cart
        Then Shooper adds extend within cart
        Then Shooper removes product
