import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Icon emoji map per notification type
const typeIcon = {
  proposal_accepted: "✅",
  proposal_received: "📨",
  escrow_funded: "💰",
  work_submitted: "📦",
  work_approved: "🎉",
  work_rejected: "❌",
  dispute_raised: "⚠️",
  dispute_resolved: "⚖️",
  payment_released: "💸",
  deadline_reminder: "⏰",
  general: "🔔",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // silently fail — don't crash the navbar
    }
  };

  const handleMarkAsRead = async (notif) => {
    if (!notif.isRead) {
      try {
        await fetch(`http://localhost:5000/api/notifications/${notif._id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {}
    }

    setOpen(false);

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleClearAll = async () => {
    try {
      await fetch("http://localhost:5000/api/notifications/clear-all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {}
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "22px",
          padding: "4px 8px",
          borderRadius: "8px",
          transition: "background 0.2s",
        }}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "#e53e3e",
              color: "white",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "bold",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "360px",
            maxHeight: "480px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              background: "white",
              zIndex: 1,
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: "15px" }}>
              Notifications {unreadCount > 0 && <span style={{ color: "#e53e3e" }}>({unreadCount})</span>}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    fontSize: "12px",
                    color: "#3182ce",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    fontSize: "12px",
                    color: "#e53e3e",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#a0aec0",
                fontSize: "14px",
              }}
            >
              🔔
              <br />
              No notifications yet
            </div>
          ) : (
            notifications.slice(0, 20).map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleMarkAsRead(notif)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f7fafc",
                  cursor: notif.link ? "pointer" : "default",
                  background: notif.isRead ? "white" : "#ebf8ff",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = notif.isRead ? "#f7fafc" : "#dbeafe")}
                onMouseLeave={(e) => (e.currentTarget.style.background = notif.isRead ? "white" : "#ebf8ff")}
              >
                {/* Icon */}
                <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>
                  {typeIcon[notif.type] || "🔔"}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontWeight: notif.isRead ? "normal" : "bold",
                      fontSize: "13px",
                      color: "#2d3748",
                      lineHeight: 1.4,
                    }}
                  >
                    {notif.title}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "12px",
                      color: "#718096",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {notif.message}
                  </p>
                  <span style={{ fontSize: "11px", color: "#a0aec0" }}>
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#3182ce",
                      flexShrink: 0,
                      marginTop: "6px",
                    }}
                  />
                )}
              </div>
            ))
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "10px",
                textAlign: "center",
                borderTop: "1px solid #e2e8f0",
                position: "sticky",
                bottom: 0,
                background: "white",
              }}
            >
              <button
                onClick={() => { setOpen(false); navigate("/dashboard/notifications"); }}
                style={{
                  fontSize: "13px",
                  color: "#3182ce",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

