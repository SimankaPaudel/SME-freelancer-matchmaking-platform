import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./Sidebar.css";

export default function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">TaskHive</h2>

      <nav className="sidebar-nav">

        {/* ── Global Search (All Users) ────────────────────── */}
        <Link to="/dashboard/search" className={isActive("/dashboard/search") ? "active" : ""}>
          Search
        </Link>

        {/* ── Freelancer ──────────────────────────────── */}
        {role === "Freelancer" && (
          <>
            <Link to="/dashboard/profile" className={isActive("/dashboard/profile") ? "active" : ""}>
              Profile
            </Link>
            <Link to="/dashboard/browse-projects" className={isActive("/dashboard/browse-projects") ? "active" : ""}>
              Browse Projects
            </Link>
            <Link to="/dashboard/my-proposals" className={isActive("/dashboard/my-proposals") ? "active" : ""}>
              My Proposals
            </Link>
            <Link to="/dashboard/messages" className={isActive("/dashboard/messages") ? "active" : ""}>
              Messages
            </Link>
            <Link to="/dashboard/payments" className={isActive("/dashboard/payments") ? "active" : ""}>
              Payments
            </Link>
            <Link to="/dashboard/my-reviews" className={isActive("/dashboard/my-reviews") ? "active" : ""}>
              ⭐ My Reviews
            </Link>
            <Link to="/dashboard/notifications" className={isActive("/dashboard/notifications") ? "active" : ""}>
              Notifications
            </Link>
          </>
        )}

        {/* ── SME ─────────────────────────────────────── */}
        {role === "SME" && (
          <>
            <Link to="/dashboard/profile" className={isActive("/dashboard/profile") ? "active" : ""}>
              Profile
            </Link>
            <Link to="/dashboard/post-project" className={isActive("/dashboard/post-project") ? "active" : ""}>
              Post Project
            </Link>
            <Link to="/dashboard/manage-projects" className={isActive("/dashboard/manage-projects") ? "active" : ""}>
              Manage Projects
            </Link>
            <Link to="/dashboard/messages" className={isActive("/dashboard/messages") ? "active" : ""}>
              Messages
            </Link>
            <Link to="/dashboard/escrow-management" className={isActive("/dashboard/escrow-management") ? "active" : ""}>
              Escrow Management
            </Link>
            <Link to="/dashboard/payments" className={isActive("/dashboard/payments") ? "active" : ""}>
              Payments
            </Link>
            <Link to="/dashboard/my-reviews" className={isActive("/dashboard/my-reviews") ? "active" : ""}>
              My Reviews
            </Link>
            <Link to="/dashboard/notifications" className={isActive("/dashboard/notifications") ? "active" : ""}>
              Notifications
            </Link>
          </>
        )}

        {/* ── Admin ───────────────────────────────────── */}
        {role === "Admin" && (
          <>
            <Link to="/dashboard/admin" className={isActive("/dashboard/admin") ? "active" : ""}>
              Admin Panel
            </Link>
          </>
        )}

      </nav>

      <div className="sidebar-bottom">
        {/* Only show bell for non-admin roles */}
        {role !== "Admin" && (
          <div className="sidebar-bell">
            <NotificationBell />
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

