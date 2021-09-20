Feature: Add Extend Product
    As a customer, I would like to purchase a product warranty

@productDetailPage
    Scenario: Shopper is able to add a warranty to a cart if it exists
        When Shopper searches for "Long Sleeve Ruffle Front Cardigan"
        Then Shopper selects color
        Then Shopper selects size
        Then Shopper selects quantity
        Then Shooper chooses a plan
        Then Shooper adds product to cart

