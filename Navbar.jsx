import React from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Navbar = () => {
  const navigate = useNavigate(); // Use this to redirect users

  // TODO: Implement the handleLogout function.
  // This function should do an API call to log the user out.
  // On successful logout, redirect the user to the login page.
  const handleLogout = async (e) => {
    e.preventDefault();
    // Implement logout logic here
    try {
      const response = await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include", // Ensures cookies are sent with the request
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        navigate("/login"); // Redirect to login page on successful logout
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // TODO: Use JSX to create a navigation bar with buttons for:
  // - Home
  // - Products
  // - Cart
  // - Logout
  return (
    <nav>
    <button onClick={() => navigate("/dashboard")}>Home</button>
    <button onClick={() => navigate("/products")}>Products</button>
    <button onClick={() => navigate("/cart")}>Cart</button>
    <button onClick={handleLogout}>Logout</button>
  </nav>
  );
};

export default Navbar;
