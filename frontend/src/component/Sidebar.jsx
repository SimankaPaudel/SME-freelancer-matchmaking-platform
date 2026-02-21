import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./Sidebar.css";

export default function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

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
        <Link
          to="/dashboard/profile"
          className={isActive("/dashboard/profile") ? "active" : ""}
        >
          👤 Profile
        </Link>

        {role === "Freelancer" && (
          <>
            <Link
              to="/dashboard/browse-projects"
              className={isActive("/dashboard/browse-projects") ? "active" : ""}
            >
              🔍 Browse Projects
            </Link>

            <Link
              to="/dashboard/my-proposals"
              className={isActive("/dashboard/my-proposals") ? "active" : ""}
            >
              📋 My Proposals
            </Link>

            <Link
              to="/dashboard/payments"
              className={isActive("/dashboard/payments") ? "active" : ""}
            >
              💳 Payments
            </Link>
          </>
        )}

        {role === "SME" && (
          <>
            <Link
              to="/dashboard/post-project"
              className={isActive("/dashboard/post-project") ? "active" : ""}
            >
              ➕ Post Project
            </Link>

            <Link
              to="/dashboard/manage-projects"
              className={isActive("/dashboard/manage-projects") ? "active" : ""}
            >
              📁 Manage Projects
            </Link>

            <Link
              to="/dashboard/escrow-management"
              className={isActive("/dashboard/escrow-management") ? "active" : ""}
            >
              💰 Escrow Management
            </Link>

            <Link
              to="/dashboard/payments"
              className={isActive("/dashboard/payments") ? "active" : ""}
            >
              💳 Payments
            </Link>
          </>
        )}

        {role === "Admin" && (
          <Link
            to="/dashboard/disputes"
            className={isActive("/dashboard/disputes") ? "active" : ""}
          >
            ⚖️ Disputes
          </Link>
        )}

        {/* Notifications — all roles */}
        <Link
          to="/dashboard/notifications"
          className={isActive("/dashboard/notifications") ? "active" : ""}
        >
          🔔 Notifications
        </Link>
      </nav>

      {/* Bell + Logout at the bottom */}
      <div className="sidebar-bottom">
        <div className="sidebar-bell">
          <NotificationBell />
          <span className="sidebar-bell-label">Notifications</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

