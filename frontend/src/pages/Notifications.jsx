import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

const typeBadgeColor = {
  escrow_funded: { bg: "#c6f6d5", color: "#22543d" },
  work_submitted: { bg: "#bee3f8", color: "#2a4365" },
  work_approved: { bg: "#c6f6d5", color: "#22543d" },
  payment_released: { bg: "#c6f6d5", color: "#22543d" },
  work_rejected: { bg: "#fed7d7", color: "#742a2a" },
  dispute_raised: { bg: "#feebc8", color: "#7b341e" },
  dispute_resolved: { bg: "#e9d8fd", color: "#44337a" },
  deadline_reminder: { bg: "#fefcbf", color: "#744210" },
  general: { bg: "#e2e8f0", color: "#2d3748" },
};

// ✅ export default is on the function itself
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await fetch("http://localhost:5000/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await fetch("http://localhost:5000/api/notifications/clear-all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {}
  };

  const handleClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  const displayed =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  if (loading)
    return (
      <div className="page-container">
        <p>Loading notifications...</p>
      </div>
    );

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>🔔 Notifications</h1>
          {unreadCount > 0 && (
            <p style={{ margin: "4px 0 0 0", color: "#718096", fontSize: "14px" }}>
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                padding: "8px 14px",
                background: "#ebf8ff",
                color: "#2b6cb0",
                border: "1px solid #bee3f8",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              ✓ Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              style={{
                padding: "8px 14px",
                background: "#fff5f5",
                color: "#c53030",
                border: "1px solid #feb2b2",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              🗑 Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          marginBottom: "20px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
          width: "fit-content",
        }}
      >
        {["all", "unread"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 20px",
              background: filter === f ? "#3182ce" : "white",
              color: filter === f ? "white" : "#4a5568",
              border: "none",
              cursor: "pointer",
              fontWeight: filter === f ? "bold" : "normal",
              fontSize: "13px",
              textTransform: "capitalize",
            }}
          >
            {f === "unread" ? `Unread (${unreadCount})` : "All"}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {displayed.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "#f7fafc",
            borderRadius: "12px",
            color: "#a0aec0",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔔</div>
          <p style={{ fontSize: "16px", margin: 0 }}>
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {displayed.map((notif) => {
            const badge = typeBadgeColor[notif.type] || typeBadgeColor.general;
            return (
              <div
                key={notif._id}
                onClick={() => handleClick(notif)}
                style={{
                  padding: "14px 16px",
                  background: notif.isRead ? "white" : "#ebf8ff",
                  border: `1px solid ${notif.isRead ? "#e2e8f0" : "#bee3f8"}`,
                  borderRadius: "10px",
                  cursor: notif.link ? "pointer" : "default",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  position: "relative",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = notif.isRead ? "#f7fafc" : "#dbeafe")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = notif.isRead ? "white" : "#ebf8ff")
                }
              >
                {/* Icon */}
                <span style={{ fontSize: "24px", flexShrink: 0, marginTop: "2px" }}>
                  {typeIcon[notif.type] || "🔔"}
                </span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: notif.isRead ? "600" : "bold",
                        fontSize: "14px",
                        color: "#2d3748",
                      }}
                    >
                      {notif.title}
                    </p>
                    <span
                      style={{ fontSize: "11px", color: "#a0aec0", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      color: "#4a5568",
                      lineHeight: 1.5,
                    }}
                  >
                    {notif.message}
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: "bold",
                        textTransform: "capitalize",
                      }}
                    >
                      {notif.type.replace(/_/g, " ")}
                    </span>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                        style={{
                          fontSize: "11px",
                          color: "#3182ce",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => deleteNotification(notif._id, e)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#cbd5e0",
                    fontSize: "16px",
                    padding: "2px",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                  title="Delete"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e53e3e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e0")}
                >
                  ✕
                </button>

                {/* Unread dot */}
                {!notif.isRead && (
                  <span
                    style={{
                      position: "absolute",
                      top: "14px",
                      right: "36px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#3182ce",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

