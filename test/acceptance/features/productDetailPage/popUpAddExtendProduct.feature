Feature: Pop Up add extend product
    As a customer, I would like to purchase a product warranty within pop up window

@productDetailPage
    Scenario: Shopper is able to add a warranty within pop up window
        When Shopper searches for "Long Sleeve Ruffle Front Cardigan"
        Then Shopper selects color
        Then Shopper selects size
        Then Shopper selects quantity
        Then Shooper adds product to cart
        Then Shooper adds warranty
