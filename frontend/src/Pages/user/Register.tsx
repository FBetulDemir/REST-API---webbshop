import type React from "react";
import { useState } from "react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await fetch("api/users/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to register");
      }

      const data = await response.json();

      setSuccess(`User created! ID: ${data.userId}`);
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setError((error as Error).message);
    }
  };
  return (
    <div>
      <h2>Registrera</h2>
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
          <label>Email:</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Lösenord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <button type="submit">Registrera</button>
      </form>
    </div>
  );
};

export default Register;
