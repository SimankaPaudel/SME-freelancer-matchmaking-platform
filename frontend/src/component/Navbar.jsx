import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <nav className={`navbar ${isHome ? "navbar-home" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="logo">🐝 TaskHive</Link>

        <div className="nav-links">
          <Link to="/" className={location.pathname === "/" ? "nav-active" : ""}>
            Home
          </Link>
          <Link to="/login" className={location.pathname === "/login" ? "nav-active" : ""}>
            Log In
          </Link>
          <Link to="/register" className="nav-btn">
            Sign Up Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

