import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/Cart.css";

const Cart = () => {
  // TODO: Implement the checkStatus function
  // If the user is already logged in, fetch the cart.
  // If not, redirect to the login page.
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState({ pincode: "", street: "", city: "", state: "" });
  useEffect(() => {
    const checkStatus = async () => {
      // Implement your logic to check if the user is logged in
      // If logged in, fetch the cart data, otherwise navigate to /login
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) {
          navigate("/login");
        } else {
          fetchCart();
        }
      } catch (err) {
        setError("Error checking login status.");
      }
    };
    checkStatus();
  }, []);

  // TODO: Manage cart state with useState
  // cart: Stores the items in the cart
  // totalPrice: Stores the total price of all cart items
  // error: Stores any error messages (if any)
  // message: Stores success or info messages
  

  // TODO: Implement the fetchCart function
  // This function should fetch the user's cart data and update the state variables
  const fetchCart = async () => {
    // Implement your logic to fetch the cart data
    // Use the API endpoint to get the user's cart
    try {
      const response = await fetch(`${apiUrl}/display-cart`, { credentials: "include" });
      const data = await response.json();
      setCart(data.cart);
      setTotalPrice(data.totalPrice);
    } catch (err) {
      setError("Failed to fetch cart items.");
    }
  };

  // TODO: Implement the updateQuantity function
  // This function should handle increasing or decreasing item quantities
  // based on user input. Make sure it doesn't exceed stock limits.
  const updateQuantity = async (productId, change) => {
    // Implement your logic for quantity update
    // Validate quantity bounds and update the cart via API
    // const newQuantity = currentQuantity + change;
    // if (newQuantity < 1 || newQuantity > stockQuantity) return;
    try {
      await fetch(`${apiUrl}/update-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id : productId, quantity: change }),
      });
      fetchCart();
    } catch (err) {
      setError("Failed to update quantity.");
    }
  };

  // TODO: Implement the removeFromCart function
  // This function should remove an item from the cart when the "Remove" button is clicked
  const removeFromCart = async (productId) => {
    // Implement your logic to remove an item from the cart
    // Use the appropriate API call to handle this
    try {
      await fetch(`${apiUrl}/remove-from-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product_id : productId }),
      });
      fetchCart();
    } catch (err) {
      setError("Failed to remove item from cart.");
    }
  };

  // TODO: Implement the handleCheckout function
  // This function should handle the checkout process and validate the address fields
  // If the user is ready to checkout, place the order and navigate to order confirmation
  const handleCheckout = async () => {
    // Implement your logic for checkout, validate address and place order
    // Make sure to clear the cart after successful checkout
    if (!address.pincode || !address.street || !address.city || !address.state) {
      setError("Please fill in all address fields.");
      return;
    }
    try {
      await fetch(`${apiUrl}/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cart, address }),
      });
      // setMessage("Order placed successfully!");
      setCart([]);
      setTotalPrice(0);
      // redirect to order confirmation page
      navigate("/order-confirmation");

    } catch (err) {
      setError("Checkout failed. Try again.");
    }
  };

  // TODO: Implement the handlePinCodeChange function
  // This function should fetch the city and state based on pincode entered by the user
  const handlePinCodeChange = async (e) => {
    // Implement the logic to fetch city and state by pincode
    // Update the city and state fields accordingly
    const pincode = e.target.value;
    setAddress({ ...address, pincode });
    try {
      if (pincode.length !== 6) {
        setAddress((prev) => ({ ...prev, city: "", state: "" }));
        return;
      }
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      var data = await response.json();
      data = data[0].PostOffice[0];
      // console.log(data[0].PostOffice[0]);
      setAddress((prev) => ({ ...prev, city: data.Name, state: data.State }));
    } catch (err) {
      setError("Invalid Pincode");
    }
  };

  // TODO: Display error messages if any error occurs
  // if (error) {
  //   return <div className="cart-error">{error}</div>;
  // }

//   return (
//     // <>
//     //   <div className="cart-container">
//     //     <h1>Your Cart</h1>

//     //     {/* TODO: Display the success or info message */}
//     //     {message && <div className="cart-message">{message}</div>}

//     //     {/* TODO: Implement the cart table UI */}
//     //     {/* If cart is empty, display an empty cart message */}
//     //     {cart.length === 0 ? (
//     //       <p className="empty-cart-message">Your cart is empty</p>
//     //     ) : (
//     //       <>
//     //         <table className="cart-table">
//     //           <thead>
//     //             <tr>
//     //               <th>Product</th>
//     //               <th>Price</th>
//     //               <th>Stock Available</th>
//     //               <th>Quantity</th>
//     //               <th>Total</th>
//     //               <th>Actions</th>
//     //             </tr>
//     //           </thead>
//     //           <tbody>
//     //             {/* TODO: Render cart items dynamically */}
//     //             {/* Use map() to render each cart item */}
//     //             {cart.map((item) => (
//     //               <tr key={item.item_id}>
//     //                 {/* TODO: Render product details here */}
//     //                 {/* Display item name, price, stock, quantity, and total */}
//     //               </tr>
//     //             ))}
//     //           </tbody>
//     //         </table>

//     //         {/* TODO: Implement the address form */}
//     //         {/* Allow users to input pincode, street, city, and state */}
//     //         <form>
//     //           {/* Implement address fields */}
//     //         </form>

//     //         {/* TODO: Display total price and the checkout button */}
//     //         <div className="cart-total">
//     //           {/* Display the total price */}
//     //           <h3>Total: ${totalPrice}</h3>
//     //           {/* Checkout button should be enabled only if there are items in the cart */}
//     //           <button onClick={handleCheckout} disabled={cart.length === 0}>
//     //             Proceed to Checkout
//     //           </button>
//     //         </div>
//     //       </>
//     //     )}
//     //   </div>
//     // </>
//     <>
//     cart
//     </>
//   );
// };

// export default Cart;

return (
  <div className="cart-container">
    <h1>Your Cart</h1>
    {message && <div className="cart-message">{message}</div>}
    {error && <div className="cart-error">{error}</div>}
    {cart.length === 0 ? (
      <p className="empty-cart-message">Loading..........</p>
    ) : (
      <>
        <table className="cart-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.item_id}>
                <td>{item.product_name}</td>
                <td>${Number(item.unit_price).toFixed(2)}</td>
                <td>{item.product_stock}</td>
                <td>
                  <button onClick={() => updateQuantity(item.item_id, -1)}>-</button>
                  {item.quantity}
                  <button onClick={() => updateQuantity(item.item_id, 1)}>+</button>
                </td>
                <td>${Number(item.unit_price * item.quantity).toFixed(2)}</td>
                <td>
                  <button onClick={() => removeFromCart(item.item_id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form>
          <label>Pincode:
            <input type="text" value={address.pincode} onChange={handlePinCodeChange} />
          </label>
          <label>Street:
            <input type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
          </label>
          <label>City:
            <input type="text" value={address.city} readOnly />
          </label>
          <label>State:
            <input type="text" value={address.state} readOnly />
          </label>
        </form>
        <div className="cart-total">
          <h3>Total: ${totalPrice.toFixed(2)}</h3>
          <button onClick={handleCheckout} disabled={cart.length === 0}>Proceed to Checkout</button>
        </div>
      </>
    )}
  </div>
);
};

export default Cart;

