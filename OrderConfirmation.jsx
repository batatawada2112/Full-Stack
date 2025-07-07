import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/OrderConfirmation.css";

const OrderConfirmation = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
     const response = await fetch(`${apiUrl}/isLoggedIn`, {
               method: "GET",
               credentials: "include",
             });
      if (!response.ok) {
        navigate("/login");
      } else {
        fetchOrderConfirmation();
      }
    };
    checkStatus();
  }, []);

  const fetchOrderConfirmation = async () => {
    try {
      const response = await fetch(`${apiUrl}/order-confirmation`, {
        credentials: "include",
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to fetch order details.");
      }

      const data = await response.json();
      // console.log(data.order)
      if (data.orderItems) {
        // Sort products by product_id in increasing order
        data.orderItems.sort((a, b) => a.product_id - b.product_id);
      }

      setOrderDetails(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="order-confirmation-container">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order! Your order has been successfully placed.</p>
  
        {error && <p className="error-message">{error}</p>}
  
        {!orderDetails ? (
          <p>Loading order details...</p>
        ) : (
          <div>
            <div className="order-summary">
              <p><strong>Order ID:</strong> <span>{orderDetails.order.order_id}</span></p>
              <p>
                <strong>Order Date:</strong>{" "}
                <span>
                  {new Date(orderDetails.order.order_date).toLocaleDateString("en-GB")}{", "}
                  {new Date(orderDetails.order.order_date).toLocaleTimeString("en-GB")}
                </span>
              </p>
              <p><strong>Total Amount:</strong> <span>${orderDetails.order.total_amount}</span></p>
            </div>
  
            <h3>Items in Your Order:</h3>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price per Item</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.orderItems.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>{product.product_name}</td>
                    <td>{product.quantity}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>${Number(product.price * product.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
  
            <button onClick={() => navigate("/products")} className="continue-shopping">
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
  
};

export default OrderConfirmation;
