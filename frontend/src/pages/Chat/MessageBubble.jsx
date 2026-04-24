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
    const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    axios
      .get(`${API_BASE_URL}/chat/my-conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setConversations(res.data))
      .catch((err) => {
        
        setError("Failed to load conversations.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="page-container">
        <p style={{ padding: "40px 20px", color: "#6b7280", textAlign: "center", fontSize: "16px" }}>
          â³ Loading your conversations...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="page-container">
        <p style={{ padding: "40px 20px", color: "#ef4444", textAlign: "center", fontSize: "16px" }}>
          âš ï¸ {error}
        </p>
      </div>
    );

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <h1>ðŸ’¬ Your Messages</h1>
        <p style={{ fontSize: "15px", color: "#7a6a55", margin: "12px 0 0 0" }}>
          {conversations.length === 0 
            ? "Start conversations with freelancers to collaborate on projects"
            : `You have ${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {conversations.length === 0 && (
        <div style={{
          background: "#fef9f4",
          border: "1px solid #e0d4c0",
          borderRadius: "14px",
          padding: "48px 28px",
          textAlign: "center",
          color: "#7a6a55"
        }}>
          <p style={{ fontSize: "18px", margin: "0", color: "#4a3728" }}>ðŸ“ª No conversations yet</p>
          <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>
            Once you start communicating with freelancers, your conversations will appear here
          </p>
        </div>
      )}

      {conversations.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px"
        }}>
          {conversations.map((c) => {
            // âœ… Guard: only navigate if projectId is a real value
            const projectId = c.projectId?._id;
            if (!projectId) return null;

            return (
              <div
                key={c._id}
                onClick={() => navigate(`/dashboard/chat/${projectId}`)}
                style={{
                  padding: "18px 20px",
                  border: "1px solid #e0d4c0",
                  borderRadius: "14px",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #fef9f4 0%, #fef6ed 100%)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 12px rgba(74, 55, 40, 0.06)",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(74, 55, 40, 0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "#b08968";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(74, 55, 40, 0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#e0d4c0";
                }}
              >
                {/* Top border accent */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #b08968 0%, #d4a574 100%)"
                }} />

                {/* Project title */}
                <div style={{
                  fontWeight: "700",
                  marginBottom: "10px",
                  fontSize: "16px",
                  color: "#4a3728",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span>ðŸ“</span>
                  <span style={{ wordBreak: "break-word" }}>
                    {c.projectId?.title || "Untitled Project"}
                  </span>
                </div>

                {/* Last message */}
                <div style={{
                  fontSize: "13px",
                  color: "#7a6a55",
                  marginBottom: "8px",
                  lineHeight: "1.4",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {c.lastMessage ? (
                    <>
                      <span style={{ color: "#a89880", fontSize: "12px" }}>Last: </span>
                      {c.lastMessage}
                    </>
                  ) : (
                    <span style={{ color: "#a89880", fontStyle: "italic" }}>No messages yet</span>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{
                  fontSize: "11px",
                  color: "#a89880",
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid #f0e0b0"
                }}>
                  {c.lastMessageAt
                    ? new Date(c.lastMessageAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "No activity yet"}
                </div>

                {/* Click indicator on hover */}
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  fontSize: "12px",
                  opacity: 0,
                  transition: "opacity 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "0";
                }}>
                  â†’
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

