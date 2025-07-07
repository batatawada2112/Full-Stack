import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Products = () => {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [products, setProducts] = useState([]); // Displayed product list
  const [searchTerm, setSearchTerm] = useState("");
  const [cartQuantities, setCartQuantities] = useState({}); // Stores quantity for each product in cart
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          navigate("/login");
        } else {
          fetchProducts();
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login");
      }
    };
    checkStatus();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${apiUrl}/list-products`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      const sortedProducts = data.products.sort((a, b) => a.product_id - b.product_id);

      setAllProducts(sortedProducts); // Store all products
      setProducts(sortedProducts); // Display all products initially

      setCartQuantities(
        sortedProducts.reduce((acc, product) => ({ ...acc, [product.product_id]: 1 }), {})
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm) {
      setProducts(allProducts); // Reset to all products if search is empty
    } else {
      setProducts(
        allProducts.filter((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, allProducts]);

  const handleQuantityChange = (productId, change) => {
    setCartQuantities((prevQuantities) => {
      const newQuantity = Math.max(1, prevQuantities[productId] + change);
      return { ...prevQuantities, [productId]: newQuantity };
    });
  };

  const addToCart = async (product_id) => {
    const quantity = cartQuantities[product_id];
    const product = products.find((p) => p.product_id === product_id);

    if (quantity > product.stock_quantity) {
      setErrorMessage(`Cannot add ${quantity} items. Only ${product.stock_quantity} in stock.`);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/add-to-cart`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id, quantity }),
      });

      const responseData = await response.json();

      if (!response.ok) throw new Error("Failed to add product to cart");

      setErrorMessage("");
      alert("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      setErrorMessage("Failed to add product to cart");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // No need to call fetchProducts() here, as filtering happens via useEffect
  };

  return (
    <>
      <Navbar />
      <div>
        <h1>Product List</h1>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Triggers filtering
          />
          <button type="submit">Search</button>
        </form>
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Stock Available</th>
              <th>Quantity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.name}</td>
                <td>${Number(product.price).toFixed(2)}</td>
                <td>{product.stock_quantity}</td>
                <td>
                  <button onClick={() => handleQuantityChange(product.product_id, -1)}>-</button>
                  {cartQuantities[product.product_id]}
                  <button onClick={() => handleQuantityChange(product.product_id, 1)}>+</button>
                </td>
                <td>
                  <button onClick={() => addToCart(product.product_id)}>ADD TO CART</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Products;
