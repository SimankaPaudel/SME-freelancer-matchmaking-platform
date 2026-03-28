import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviewsForUser } from "../services/reviewService";

function Stars({ value, size = "md" }) {
  const full = Math.floor(value || 0);
  const half = (value || 0) - full >= 0.4;
  return (
    <span className="stars-display" style={{ fontSize: size === "lg" ? "24px" : "16px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{
            color:
              s <= full
                ? "#f39c12"
                : s === full + 1 && half
                  ? "#f39c12"
                  : "#ddd",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function RatingDisplay({ userId, onViewReviews }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const response = await getReviewsForUser(userId);
        setStats(response.data.stats);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  if (loading) return <p style={{ color: "#999" }}>Loading ratings...</p>;
  if (!stats || stats.totalReviews === 0) return <p style={{ color: "#999" }}>No ratings yet</p>;

  return (
    <div style={{ marginTop: "12px", padding: "12px", background: "#fdf3e3", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Stars value={stats.averageRating} />
            <span style={{ fontWeight: "bold", fontSize: "18px", color: "#4a3728" }}>
              {stats.averageRating.toFixed(1)}/5
            </span>
          </div>
          <p style={{ margin: "4px 0", fontSize: "12px", color: "#666" }}>
            {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {onViewReviews && (
        <button
          onClick={onViewReviews}
          style={{
            background: "#b08968",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            marginTop: "8px",
            marginRight: "8px",
          }}
        >
          View Reviews
        </button>
      )}
      <button
        onClick={() => navigate(`/profile/${userId}`)}
        style={{
          background: "#4a3728",
          color: "white",
          border: "none",
          padding: "6px 12px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          marginTop: "8px",
        }}
      >
        View Full Profile
      </button>
    </div>
  );
}
