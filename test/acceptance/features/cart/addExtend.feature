Feature: Add extend within a cart
    As a customer, I would like to add warranty within cart

@cart
    Scenario: Shopper is able to add warranty within cart
        When Shopper searches for "Long Sleeve Ruffle Front Cardigan"
        Then Shopper selects color
        Then Shopper selects size
        Then Shopper selects quantity
        Then Shooper adds product to cart
        Then Shooper rejects the purchase of warranty
        Then Shooper goes to cart
        Then Shooper adds extend within cart
