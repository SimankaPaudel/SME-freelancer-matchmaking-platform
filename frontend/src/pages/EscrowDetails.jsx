import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EscrowTimeline from "../component/EscrowTimeline";
import { getReviewByEscrow } from "../services/reviewService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";

export default function EscrowDetails() {
  const { escrowId } = useParams();
  const navigate = useNavigate();

  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Decode current user role from JWT
  const currentUserRole = (() => {
    try {
      const token = localStorage.getItem("accessToken");
      return JSON.parse(atob(token.split(".")[1])).role || "";
    } catch { return ""; }
  })();

  const loadEscrow = async () => {
    if (!escrowId) {
      setMessage("âŒ Invalid escrow link.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `${API_BASE_URL}/escrows/${escrowId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } }
      );
      setEscrow(res.data);

      // Check if current user already reviewed
      if (res.data.status === "Released") {
        try {
          const reviewRes = await getReviewByEscrow(escrowId);
          if (reviewRes.data.myReview) setAlreadyReviewed(true);
        } catch {}
      }
    } catch (err) {
      
      setMessage("âŒ Failed to load escrow details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscrow();
  }, [escrowId]);

  if (loading) return <p>Loading escrow...</p>;
  if (!escrow)
    return (
      <div className="page-container">
        <p style={{ color: "red" }}>{message || "Escrow not found"}</p>
        <button onClick={() => navigate(-1)}>â† Go Back</button>
      </div>
    );

  const statusColors = {
    "Pending Deposit": { background: "#fefcbf", color: "#744210" },
    Funded:            { background: "#c6f6d5", color: "#22543d" },
    "In Progress":     { background: "#bee3f8", color: "#2a4365" },
    Submitted:         { background: "#e9d8fd", color: "#44337a" },
    Released:          { background: "#c6f6d5", color: "#22543d" },
    Rejected:          { background: "#fed7d7", color: "#742a2a" },
    Disputed:          { background: "#feebc8", color: "#7b341e" },
    Refunded:          { background: "#e2e8f0", color: "#2d3748" },
  };
  const statusStyle = statusColors[escrow.status] || { background: "#e2e8f0", color: "#2d3748" };

  const isReleased = escrow.status === "Released";

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <h2>Escrow Details</h2>

      {/* â”€â”€ Summary card â”€â”€ */}
      <div style={{
        padding: "20px",
        background: "#f7f1e8",
        border: "1px solid #e0d4c0",
        borderRadius: "10px",
        marginBottom: "24px",
      }}>
        <h3 style={{ marginTop: 0, color: "#4a3728" }}>
          {escrow.projectId?.title || "Project"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <p style={{ margin: "4px 0", color: "#7a6a55", fontSize: "13px" }}>Amount</p>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px", color: "#4a3728" }}>
              â‚¹{escrow.amount?.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: "4px 0", color: "#7a6a55", fontSize: "13px" }}>Status</p>
            <span style={{
              ...statusStyle,
              padding: "4px 12px",
              borderRadius: "999px",
              fontWeight: "bold",
              fontSize: "13px",
              display: "inline-block",
            }}>
              {escrow.status}
            </span>
          </div>
          <div>
            <p style={{ margin: "4px 0", color: "#7a6a55", fontSize: "13px" }}>Freelancer</p>
            <p style={{ margin: 0, color: "#4a3728" }}>
              {escrow.freelancerId?.fullName || "N/A"}{" "}
              <span style={{ color: "#a89880", fontSize: "12px" }}>
                ({escrow.freelancerId?.email})
              </span>
            </p>
          </div>
          <div>
            <p style={{ margin: "4px 0", color: "#7a6a55", fontSize: "13px" }}>SME</p>
            <p style={{ margin: 0, color: "#4a3728" }}>
              {escrow.smeId?.fullName || "N/A"}{" "}
              <span style={{ color: "#a89880", fontSize: "12px" }}>
                ({escrow.smeId?.email})
              </span>
            </p>
          </div>
        </div>

        {/* Payment verified */}
        {escrow.paymentVerifiedAt && (
          <p style={{ marginTop: "12px", color: "#276749", fontSize: "13px" }}>
            âœ… Payment verified on {new Date(escrow.paymentVerifiedAt).toLocaleString()}
          </p>
        )}

        {/* Released */}
        {escrow.releasedAt && (
          <p style={{ marginTop: "4px", color: "#276749", fontSize: "13px" }}>
            Payment released on {new Date(escrow.releasedAt).toLocaleString()}
          </p>
        )}

        {/* Rejection reason */}
        {escrow.rejectionReason && (
          <div style={{
            marginTop: "12px", padding: "10px",
            background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: "6px",
          }}>
            <strong style={{ color: "#c53030" }}>Rejection Reason:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{escrow.rejectionReason}</p>
          </div>
        )}

        {/* Dispute reason */}
        {escrow.disputeReason && (
          <div style={{
            marginTop: "12px", padding: "10px",
            background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "6px",
          }}>
            <strong style={{ color: "#d97706" }}>Dispute Reason:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{escrow.disputeReason}</p>
          </div>
        )}

        {/* Dispute resolution */}
        {escrow.disputeResolution && (
          <div style={{
            marginTop: "12px", padding: "10px",
            background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: "6px",
          }}>
            <strong style={{ color: "#276749" }}>Dispute Resolution:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{escrow.disputeResolution}</p>
          </div>
        )}

        {/* Submitted file */}
        {escrow.submittedFile && (
          <div style={{ marginTop: "12px" }}>
            <a
              href={`${API_BASE}/${escrow.submittedFile}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block", padding: "8px 16px",
                background: "#b08968", color: "white",
                borderRadius: "6px", textDecoration: "none", fontSize: "14px",
              }}
            >
              Download Submitted Work
            </a>
            {escrow.submissionComment && (
              <p style={{ marginTop: "8px", color: "#4a5568" }}>
                <strong>Comment:</strong> {escrow.submissionComment}
              </p>
            )}
          </div>
        )}
      </div>

      {/* â”€â”€ Leave a Review â€” shown to FREELANCER only after payment released â”€â”€ */}
      {isReleased && currentUserRole === "Freelancer" && (
        <div style={{
          padding: "16px 20px",
          background: "#fdf3e3",
          border: "1px solid #e0d4c0",
          borderRadius: "10px",
          marginBottom: "24px",
        }}>
          <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#4a3728" }}>
            â­ How was your experience with this client?
          </p>
          {!alreadyReviewed ? (
            <button
              className="btn-review"
              onClick={() => navigate(`/dashboard/submit-review/${escrowId}`)}
            >
              â­ Leave a Review
            </button>
          ) : (
            <p style={{ margin: 0, color: "#7a6a55", fontSize: "14px" }}>
              âœ“ You have already submitted your review for this project.
            </p>
          )}
        </div>
      )}

      {/* â”€â”€ Timeline â”€â”€ */}
      <div>
        <h4 style={{ color: "#4a3728" }}>Timeline</h4>
        <EscrowTimeline timeline={escrow.timeline} />
      </div>

      {/* â”€â”€ Back button â”€â”€ */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: "24px", padding: "10px 24px",
          background: "#f7f1e8", color: "#4a3728",
          border: "1px solid #e0d4c0", borderRadius: "6px", cursor: "pointer",
        }}
      >
        â† Go Back
      </button>

      {message && (
        <p style={{ color: "red", marginTop: "12px" }}>{message}</p>
      )}
    </div>
  );
}

