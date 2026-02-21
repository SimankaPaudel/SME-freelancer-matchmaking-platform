import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <h2 className="logo">TaskHive</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register" className="nav-btn">Register</Link>
        </div>
      </div>
    </nav>
  );
}
