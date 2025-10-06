import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Login.css";

const Login = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Inkludera session cookies
        body: JSON.stringify({ name, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      console.log("Login attempt:", name);
      
      // Logga in användaren i auth context
      login({
        id: data.userId || 'user123',
        name: name,
        email: data.email || ''
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="login-body">
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <p>Logga in för att kunna köpa!</p>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Namn:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Lösenord:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div style={{ color: "red" }}>{error}</div>}
          <button className="login-btn" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
