import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";


export default function Register() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", fullName: "",
    email: "", password: "", confirmPassword: "", role: "Freelancer",
  });
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError("All required fields must be filled"); setLoading(false); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Invalid email format"); setLoading(false); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long"); setLoading(false); return;
    }
    if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("Password must contain at least one letter and one number"); setLoading(false); return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError("Password must contain at least one special character (!@#$%^&* etc.)"); setLoading(false); return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match"); setLoading(false); return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details ? `${data.message}: ${data.details}` : data.message || "Registration failed");
        setLoading(false); return;
      }
      alert("Registration successful! Please login with your credentials.");
      navigate("/login");
    } catch (err) {
      setError(`Network error: ${err.message}.`);
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create your account</h2>
        <p className="register-subtitle">Join our SME-freelancer matchmaking platform today</p>

        {error && <div className="register-error">{error}</div>}

        <form className="register-form" onSubmit={handleRegister}>
          <input name="firstName" placeholder="First Name *" value={form.firstName} onChange={handleChange} required disabled={loading} />
          <input name="lastName"  placeholder="Last Name *"  value={form.lastName}  onChange={handleChange} required disabled={loading} />
          <input name="fullName"  placeholder="Full Name (optional)" value={form.fullName} onChange={handleChange} disabled={loading} />
          <input name="email" type="email" placeholder="Email address *" value={form.email} onChange={handleChange} required disabled={loading} />

          <div className="auth-password-wrapper">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 8, letter + number + special) *"
              value={form.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div className="auth-password-wrapper">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password *"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <select name="role" value={form.role} onChange={handleChange} disabled={loading}>
            <option value="Freelancer">👨‍💻 I'm a Freelancer</option>
            <option value="SME">🏢 I'm an SME (Business)</option>
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

