Feature: Add product without extend
    As a customer, I would like to purchase a product without warranty

@productDetailPage
    Scenario: Shopper is able to add product without warranty
        When Shopper searches for "Long Sleeve Ruffle Front Cardigan"
        Then Shopper selects color
        Then Shopper selects size
        Then Shopper selects quantity
        Then Shooper adds product to cart
        Then Shooper rejects the purchase of warranty
