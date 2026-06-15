// Pre-loaded raw, messy CSV datasets for multiple operational concepts
const samples = {
  // 1. BISTRO ROYALE: Focuses on shoulder labor leakage and void variance
  bistro: {
    name: "Bistro Royale",
    salesMix: `product_name,dept_group,qty_sold,net_revenue_total,recipe_cost,retail_price
Truffle Burger,Entrees,145,2610.00,6.50,18.00
Crispy Calamari,Appetizers,85,1190.00,N/A,14.00
Truffle Mac & Cheese,Sides,12,168.00,6.20,14.00
Classic Cheeseburger,Entrees,280,4200.00,4.20,15.00
Caesar Salad,Sides,120,1320.00,2.10,11.00
Spicy Chicken Sandwich,Entrees,190,3040.00,4.50,16.00
Craft IPA,Beverages,340,2720.00,1.20,8.00
House Red Wine,Beverages,150,1500.00,2.50,10.00
Chocolate Lava Cake,Desserts,45,405.00,1.80,9.00`,
    labor: `date_time_period,hourly_sales_total,hours_clocked,payroll_spend_total
2026-06-02T11:00:00,320.00,4.0,76.00
2026-06-02T12:00:00,850.00,8.0,152.00
2026-06-02T13:00:00,1200.00,10.0,190.00
2026-06-02T14:00:00,240.00,8.0,152.00
2026-06-02T15:00:00,85.00,-2.5,47.50
2026-06-02T16:00:00,90.00,6.0,114.00
2026-06-02T17:00:00,410.00,6.0,114.00
2026-06-02T18:00:00,1450.00,12.0,228.00
2026-06-02T19:00:00,2200.00,14.0,266.00
2026-06-02T20:00:00,1800.00,14.0,266.00
2026-06-02T21:00:00,980.00,10.0,190.00
2026-06-02T22:00:00,310.00,6.0,114.00
2026-06-02T22:00:00,310.00,6.0,114.00
2026-06-03T11:00:00,280.00,4.0,76.00
2026-06-03T12:00:00,720.00,8.0,152.00
2026-06-03T13:00:00,950.00,10.0,190.00
2026-06-03T14:00:00,180.00,8.0,152.00
2026-06-03T15:00:00,60.00,6.0,114.00
2026-06-03T16:00:00,75.00,6.0,114.00
2026-06-03T17:00:00,350.00,6.0,114.00
2026-06-03T18:00:00,1300.00,12.0,228.00
2026-06-03T19:00:00,1900.00,14.0,266.00
2026-06-03T20:00:00,1600.00,14.0,266.00
2026-06-03T21:00:00,850.00,10.0,190.00
2026-06-03T22:00:00,240.00,6.0,114.00`,
    voids: `tx_check_id,timestamp_date,employee_staff,check_total_amount,voided_amount,void_reason_code
TX-100230,2026-06-05T18:12:00,Alex M.,85.00,0.00,
TX-100231,2026-06-05T18:15:00,Sarah T.,110.00,15.00,Customer Dissatisfied
TX-100232,2026-06-05T18:22:00,John D.,45.00,0.00,
TX-100233,2026-06-05T18:30:00,Alex M.,130.00,0.00,
TX-100234,2026-06-05T18:42:00,Sarah T.,90.00,30.00,Kitchen Error
TX-100235,2026-06-05T18:55:00,John D.,75.00,0.00,
TX-100236,2026-06-05T19:10:00,Alex M.,160.00,12.00,Mistake
TX-100237,2026-06-05T19:12:00,Sarah T.,140.00,45.00,Customer Dissatisfied
TX-100238,2026-06-05T19:25:00,John D.,210.00,0.00,
TX-100239,2026-06-05T19:30:00,Alex M.,95.00,0.00,
TX-100240,2026-06-05T19:40:00,Sarah T.,80.00,0.00,
TX-100241,2026-06-05T20:00:00,Sarah T.,120.00,0.00,
TX-100242,2026-06-05T20:10:00,Alex M.,70.00,0.00,
TX-100243,2026-06-05T20:15:00,John D.,125.00,0.00,
TX-100244,2026-06-05T20:30:00,Sarah T.,240.00,0.00,
TX-100245,2026-06-05T20:45:00,Sarah T.,110.00,0.00,
TX-100246,2026-06-05T21:00:00,John D.,85.00,10.00,Kitchen Error
TX-100247,2026-06-05T21:15:00,Alex M.,105.00,0.00,
TX-100248,2026-06-05T21:20:00,Sarah T.,150.00,0.00,
TX-100249,2026-06-05T21:40:00,Sarah T.,95.00,0.00,
TX-100250,2026-06-05T22:00:00,Sarah T.,810.00,0.00,`
  },

  // 2. URBAN SLICE: Pizza shop with menu cost drag (Dogs) & cashier comp irregularities
  urbanSlice: {
    name: "Urban Slice",
    salesMix: `product_name,dept_group,qty_sold,net_revenue_total,recipe_cost,retail_price
Pepperoni Pizza,Pizzas,380,1900.00,1.25,5.00
Gluten-Free BBQ Chicken Slice,Pizzas,14,119.00,4.80,8.50
Cheese Pizza,Pizzas,420,1680.00,0.95,4.00
Garlic Knots,Sides,220,1100.00,0.60,5.00
Garden Salad,Sides,80,640.00,N/A,8.00
Fountain Soda,Beverages,600,1800.00,0.15,3.00
Mozzarella Sticks,Sides,190,1330.00,1.90,7.00`,
    labor: `date_time_period,hourly_sales_total,hours_clocked,payroll_spend_total
2026-06-02T11:00:00,150.00,2.0,38.00
2026-06-02T12:00:00,600.00,4.0,76.00
2026-06-02T13:00:00,800.00,5.0,95.00
2026-06-02T14:00:00,110.00,4.0,76.00
2026-06-02T15:00:00,40.00,4.0,76.00
2026-06-02T16:00:00,65.00,4.0,76.00
2026-06-02T17:00:00,290.00,5.0,95.00
2026-06-02T18:00:00,950.00,6.0,114.00
2026-06-02T19:00:00,1100.00,6.0,114.00
2026-06-02T20:00:00,750.00,5.0,95.00
2026-06-02T21:00:00,410.00,3.0,57.00
2026-06-02T22:00:00,120.00,2.0,38.00`,
    voids: `tx_check_id,timestamp_date,employee_staff,check_total_amount,voided_amount,void_reason_code
TX-3001,2026-06-05T12:10:00,Marcus K.,15.00,0.00,
TX-3002,2026-06-05T12:15:00,Emily R.,22.00,8.00,Promo Swap
TX-3003,2026-06-05T12:20:00,Marcus K.,12.00,0.00,
TX-3004,2026-06-05T12:40:00,Marcus K.,8.00,0.00,
TX-3005,2026-06-05T13:10:00,Emily R.,35.00,12.00,Promo Swap
TX-3006,2026-06-05T13:20:00,Marcus K.,18.00,0.00,
TX-3007,2026-06-05T13:42:00,Emily R.,25.00,9.00,Promo Swap
TX-3008,2026-06-05T14:15:00,Emily R.,14.00,0.00,
TX-3009,2026-06-05T14:40:00,Marcus K.,10.00,0.00,`
  },

  // 3. MORNING GRIND: Coffee shop with early-morning labor leakage (baristas clocked in with 0 sales)
  morningGrind: {
    name: "Morning Grind",
    salesMix: `product_name,dept_group,qty_sold,net_revenue_total,recipe_cost,retail_price
Drip Coffee,Coffee,820,2460.00,0.20,3.00
Vanilla Latte,Coffee,410,2255.00,0.85,5.50
Avocado Toast,Food,50,425.00,3.10,8.50
Butter Croissant,Food,190,855.00,0.90,4.50
Iced Cold Brew,Coffee,310,1395.00,0.30,4.50
Keto Power Protein Bar,Food,8,40.00,3.20,5.00`,
    labor: `date_time_period,hourly_sales_total,hours_clocked,payroll_spend_total
2026-06-02T05:00:00,10.00,4.0,76.00
2026-06-02T06:00:00,35.00,5.0,95.00
2026-06-02T07:00:00,410.00,5.0,95.00
2026-06-02T08:00:00,980.00,6.0,114.00
2026-06-02T09:00:00,1200.00,6.0,114.00
2026-06-02T10:00:00,850.00,5.0,95.00
2026-06-02T11:00:00,450.00,4.0,76.00
2026-06-02T12:00:00,610.00,4.0,76.00
2026-06-02T13:00:00,310.00,3.0,57.00
2026-06-02T14:00:00,120.00,2.0,38.00`,
    voids: `tx_check_id,timestamp_date,employee_staff,check_total_amount,voided_amount,void_reason_code
TX-5001,2026-06-05T07:15:00,Kenji S.,8.50,0.00,
TX-5002,2026-06-05T07:20:00,Aria L.,12.00,0.00,
TX-5003,2026-06-05T07:45:00,Kenji S.,6.00,0.00,
TX-5004,2026-06-05T08:10:00,Aria L.,18.50,0.00,
TX-5005,2026-06-05T08:30:00,Kenji S.,9.00,0.00,`
  },

  // 4. CAMPUS CAFE: University food court with severe Cashier Comp/Void anomalies (Z-Score variance)
  campusCafe: {
    name: "Campus Cafe",
    salesMix: `product_name,dept_group,qty_sold,net_revenue_total,recipe_cost,retail_price
Chicken Tenders Basket,Entrees,450,4950.00,2.80,11.00
Loaded Waffle Fries,Sides,290,2030.00,1.10,7.00
Double Bacon Smashburger,Entrees,310,3720.00,3.90,12.00
Fountain Beverage,Beverages,800,2000.00,0.12,2.50
Mozzarella Sticks,Sides,180,1260.00,1.60,7.00
Vegan Quinoa Bowl,Entrees,6,72.00,4.90,12.00`,
    labor: `date_time_period,hourly_sales_total,hours_clocked,payroll_spend_total
2026-06-02T11:00:00,650.00,6.0,114.00
2026-06-02T12:00:00,1850.00,10.0,190.00
2026-06-02T13:00:00,2100.00,10.0,190.00
2026-06-02T14:00:00,320.00,8.0,152.00
2026-06-02T15:00:00,180.00,6.0,114.00
2026-06-02T16:00:00,220.00,6.0,114.00
2026-06-02T17:00:00,890.00,8.0,152.00
2026-06-02T18:00:00,1450.00,10.0,190.00
2026-06-02T19:00:00,1100.00,10.0,190.00
2026-06-02T20:00:00,410.00,6.0,114.00`,
    voids: `tx_check_id,timestamp_date,employee_staff,check_total_amount,voided_amount,void_reason_code
TX-8001,2026-06-05T12:12:00,Dave K.,24.00,0.00,
TX-8002,2026-06-05T12:15:00,Alex M.,18.50,11.00,Customer Dissatisfied
TX-8003,2026-06-05T12:20:00,Lina P.,31.00,0.00,
TX-8004,2026-06-05T12:45:00,Alex M.,42.00,25.00,Kitchen Error
TX-8005,2026-06-05T13:10:00,Lina P.,15.00,0.00,
TX-8006,2026-06-05T13:20:00,Dave K.,22.00,0.00,
TX-8007,2026-06-05T13:30:00,Alex M.,33.00,20.00,Customer Dissatisfied
TX-8008,2026-06-05T13:50:00,Lina P.,28.50,0.00,
TX-8009,2026-06-05T14:15:00,Dave K.,19.00,0.00,
TX-8010,2026-06-05T14:30:00,Alex M.,14.50,9.50,Mistake`
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = samples;
}
