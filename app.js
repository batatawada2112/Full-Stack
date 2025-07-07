const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 4000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'test',
  host: 'localhost',
  database: 'ecommerce',
  password: 'test',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Session information
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);



/////////////////////////////////////////////////////////////
// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// TODO: Implement authentication middleware
// Redirect unauthenticated users to the login page with respective status code
function isAuthenticated(req, res, next) {
if (req.session.userId) {
  return next();
} else {
  return res.status(400).json({ message: "Unauthorized" }), res.redirect("/login");
}
}
// TODO: Implement API used to check if the client is currently logged in or not.
// use correct status codes and messages mentioned in the lab document
app.get("/isLoggedIn", async (req, res) => {
  if(req.session.userId){
    return res.status(200).json({message: "Logged In", username: req.session.username});
  }
  res.status(401).json({message: "Not Logged In"});
  
});

// TODO: Implement user signup logic
// return JSON object with the following fields: {username, email, password}
// use correct status codes and messages mentioned in the lab document
app.post('/signup', async (req, res) => {
  
  try {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
  
    const userExists = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Error: Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username' , [username, email, hashedPassword]);

    // console.log(userExists.fields);
    req.session.userId = newUser.rows[0].user_id;
    req.session.username = newUser.rows[0].username;
    res.status(200).json({ message: "User Registered Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing up" });
  }
});

// TODO: Implement user signup logic
// return JSON object with the following fields: {email, password}
// use correct status codes and messages mentioned in the lab document
app.post("/login", async (req, res) => {
  try{
    const {email, password} = req.body;
    console.log(email);
    console.log(password);
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    // what is credentials are invalid
    if(user.rows.length === 0){
      return res.status(400).json({message: "Invalid credentials"});
    }
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if(!validPassword){
      return res.status(400).json({message: "Invalid credentials"});
    }
    // api will create a new session for the user if login is successful
    req.session.userId = user.rows[0].user_id;
    req.session.username = user.rows[0].username;
    res.status(200).json({message: "Login Successful"});
  }
  catch(error){
    console.error(error);
    res.status(500).json({message: "Error logging in"});
  }
});



// TODO: Implement API used to logout the user
// use correct status codes and messages mentioned in the lab document
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if(err){
      return res.status(500).json({message: "Error logging out"});
    }
    res.status(200).json({message: "Logout Successful"});
  });
});

////////////////////////////////////////////////////
// APIs for the products
// use correct status codes and messages mentioned in the lab document
// TODO: Fetch and display all products from the database
app.get("/list-products", isAuthenticated, async (req, res) => {
  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }
  try {
    const products = await pool.query('SELECT * FROM products');
    res.status(200).json({ message: "Products fetched successfully", products: products.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error listing products" });
  }
});

// APIs for cart: add_to_cart, display-cart, remove-from-cart
// TODO: impliment add to cart API which will add the quantity of the product specified by the user to the cart
app.post("/add-to-cart", isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;
  // console.log(req.session.userId);

  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  try {
    const product = await pool.query('SELECT * FROM products WHERE product_id = $1', [product_id]);
  
    if (product.rows.length === 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (product.rows[0].stock < quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${product.rows[0].name}.` });
    }

    const cartItem = await pool.query('SELECT * FROM cart WHERE user_id = $1 AND item_id = $2', [req.session.userId, product_id]);

    if (cartItem.rows.length > 0) {
      const newQuantity = cartItem.rows[0].quantity + quantity;
      await pool.query('UPDATE cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3', [newQuantity, req.session.userId, product_id]);
    } else {
      await pool.query('INSERT INTO cart (user_id, item_id, quantity) VALUES ($1, $2, $3)', [req.session.userId, product_id, quantity]);
    }

    res.status(200).json({ message: `Successfully added ${quantity} of ${product.rows[0].name} to your cart.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }

});

// TODO: Implement display-cart API which will returns the products in the cart
app.get("/display-cart", isAuthenticated, async (req, res) => {
  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  try {
    const cartItems = await pool.query(`
      SELECT 
        cart.item_id, 
        cart.quantity, 
        products.product_id AS product_id, 
        products.name AS product_name, 
        products.price AS unit_price, 
        (cart.quantity * products.price) AS total_item_price,
        products.stock_quantity as product_stock
      FROM cart 
      JOIN products ON cart.item_id = products.product_id 
      WHERE cart.user_id = $1
    `, [req.session.userId]);

    if (cartItems.rows.length === 0) {
      return res.status(200).json({ message: "No items in cart.", cart: [], totalPrice: 0 });
    }

    const totalPrice = cartItems.rows.reduce((acc, item) => acc + Number(item.total_item_price), 0);

    res.status(200).json({ message: "Cart fetched successfully.", cart: cartItems.rows, totalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cart" });
  }
});

// TODO: Implement remove-from-cart API which will remove the product from the cart
app.post("/remove-from-cart", isAuthenticated, async (req, res) => {
  const { product_id } = req.body;

  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  try {
    const cartItem = await pool.query('SELECT * FROM cart WHERE user_id = $1 AND item_id = $2', [req.session.userId, product_id]);

    if (cartItem.rows.length === 0) {
      return res.status(400).json({ message: "Item not present in your cart." });
    }

    await pool.query('DELETE FROM cart WHERE user_id = $1 AND item_id = $2', [req.session.userId, product_id]);

    res.status(200).json({ message: "Item removed from your cart successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error removing item from cart" });
  }

});
// TODO: Implement update-cart API which will update the quantity of the product in the cart
app.post("/update-cart", isAuthenticated, async (req, res) => {
  const { product_id, quantity } = req.body;

  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  try {
    const product = await pool.query('SELECT * FROM products WHERE product_id = $1', [product_id]);

    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({ message: "Requested quantity exceeds available stock" });
    }

    const cartItem = await pool.query('SELECT * FROM cart WHERE user_id = $1 AND item_id = $2', [req.session.userId, product_id]);

    if (cartItem.rows.length > 0) {
      const newQuantity = cartItem.rows[0].quantity + quantity;
      if (newQuantity <= 0) {
        await pool.query('DELETE FROM cart WHERE user_id = $1 AND item_id = $2', [req.session.userId, product_id]);
      } 
      else if(newQuantity >0 && newQuantity <= product.rows[0].stock_quantity){
        await pool.query('UPDATE cart SET quantity = $1 WHERE user_id = $2 AND item_id = $3', [newQuantity, req.session.userId, product_id]);
      }
      else{
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
      }
    } else {
        await pool.query('INSERT INTO cart (user_id, item_id, quantity) VALUES ($1, $2, $3)', [req.session.userId, product_id, quantity]);
    
    }

    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating cart" });
  }
});

// APIs for placing order and getting confirmation
// TODO: Implement place-order API, which updates the order,orderitems,cart,orderaddress tables
app.post("/place-order", isAuthenticated, async (req, res) => {
  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  try {
    const {cart, address} = req.body;
    const order_date = new Date().toISOString();
    const cartQuery = `
      SELECT c.item_id, c.quantity, p.price, p.stock_quantity, p.name
      FROM cart c
      JOIN products p ON c.item_id = p.product_id
      WHERE c.user_id = $1
    `;
    const cartItems = await pool.query(cartQuery, [req.session.userId]);

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: "Cart is Empty" });
    }
    for (let item of cartItems.rows) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).send(`Insufficient stock for product: ${item.name}`);
      }
    }

    let totalPrice = 0;
    for (let item of cartItems.rows) {
      totalPrice += item.quantity * item.price;
    }

    const orderQuery = `
      INSERT INTO orders (user_id, order_date, total_amount)
      VALUES ($1, $2, $3)
      RETURNING order_id
    `
    const order = await pool.query(orderQuery, [req.session.userId, order_date, totalPrice]);

    for (let item of cartItems.rows) {
      const orderItemQuery = `
        INSERT INTO orderitems (order_id, product_id, quantity,price)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(orderItemQuery, [order.rows[0].order_id, item.item_id, item.quantity, item.price]);
      await pool.query(
        'UPDATE Products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
        [item.quantity, item.item_id]
      );
    }

    // update orderaddress table with the order_id and address
    const orderAddressQuery = `
      INSERT INTO orderaddress (order_id, street, city, state, pincode)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(orderAddressQuery, [order.rows[0].order_id, address.street, address.city, address.state, address.pincode]);


    // Clear the cart
    await pool.query('DELETE FROM cart WHERE user_id = $1', [req.session.userId]);

    res.status(200).json({ message: "Order placed successfully" });
    }

  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error placing order" });
  }
});

// API for order confirmation
// TODO: same as lab4
app.get("/order-confirmation", isAuthenticated, async (req, res) => {
  if (!req.session.userId) {
    return res.status(400).json({ message: "Unauthorized" });
  }

  try {
    const orderQuery = `
      SELECT * FROM orders 
      WHERE user_id = $1 
      ORDER BY order_date DESC 
      LIMIT 1
    `;
    const orderResult = await pool.query(orderQuery, [req.session.userId]);

    if (orderResult.rows.length === 0) {
      return res.status(400).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    const orderItemsQuery = `
      SELECT oi.order_id, oi.product_id, oi.quantity, oi.price, p.name AS product_name 
      FROM orderitems oi 
      JOIN products p ON oi.product_id = p.product_id 
      WHERE oi.order_id = $1
    `;
    const orderItemsResult = await pool.query(orderItemsQuery, [order.order_id]);

    res.status(200).json({
      message: "Order fetched successfully",
      order,
      orderItems: orderItemsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order details" });
  }
});

////////////////////////////////////////////////////
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});