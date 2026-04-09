import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function MessageBubble() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    axios
      .get("http://localhost:5000/api/chat/my-conversations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setConversations(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load conversations.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p style={{ padding: 20, color: "#6b7280" }}>Loading messages...</p>;

  if (error)
    return <p style={{ padding: 20, color: "#ef4444" }}>⚠️ {error}</p>;

  return (
    <div style={{ padding: 20, maxWidth: 620, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 16 }}>Messages</h2>

      {conversations.length === 0 && (
        <p style={{ color: "#6b7280" }}>No conversations yet.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {conversations.map((c) => {
          // ✅ Guard: only navigate if projectId is a real value
          const projectId = c.projectId?._id;
          if (!projectId) return null;

          return (
            <li
              key={c._id}
              onClick={() => navigate(`/dashboard/chat/${projectId}`)}
              style={{
                padding: "14px 18px",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                cursor: "pointer",
                background: "#fff",
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.09)";
                e.currentTarget.style.borderColor = "#a5b4fc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e5e7eb";
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                [Folder] {c.projectId?.title || "Untitled Project"}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                {c.lastMessage || "No messages yet"}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                {c.lastMessageAt
                  ? new Date(c.lastMessageAt).toLocaleString()
                  : ""}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

