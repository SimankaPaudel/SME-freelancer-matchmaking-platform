import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Freelancer",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side validation
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError("All required fields must be filled");
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    // Password length check
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Password validation - must contain at least one letter AND one number
    const hasLetter = /[a-zA-Z]/.test(form.password);
    const hasNumber = /\d/.test(form.password);

    if (!hasLetter || !hasNumber) {
      setError("Password must contain at least one letter and one number");
      setLoading(false);
      return;
    }

    // Check passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    console.log("Attempting registration with:", {
      ...form,
      password: "***",
      confirmPassword: "***"
    });

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (!res.ok) {
        // Show detailed error from server
        const errorMsg = data.details 
          ? `${data.message}: ${data.details}` 
          : data.message || "Registration failed";
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Don't store tokens on registration - user must login
      alert("Registration successful! Please login with your credentials.");
      navigate("/login");
    } catch (err) {
      console.error("Registration fetch error:", err);
      setError(`Network error: ${err.message}. Is the server running on port 5000?`);
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create your account</h2>
        <p className="register-subtitle">Join our SME-freelancer matchmaking platform today</p>

        {error && (
          <div style={{
            padding: "12px",
            marginBottom: "16px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            color: "#c00"
          }}>
            {error}
          </div>
        )}

        <form className="register-form" onSubmit={handleRegister}>
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            name="fullName"
            placeholder="Full Name (optional)"
            value={form.fullName}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min 8 chars, must have letters + numbers)"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <select name="role" value={form.role} onChange={handleChange} disabled={loading}>
            <option value="Freelancer">Freelancer</option>
            <option value="SME">SME</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}