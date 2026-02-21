import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import EscrowTimeline from "../component/EscrowTimeline";

export default function EscrowDetails() {
  // ✅ FIXED: route is /dashboard/escrow/:escrowId so param is "escrowId"
  const { escrowId } = useParams();
  const navigate = useNavigate();
  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadEscrow = async () => {
    if (!escrowId) {
      setMessage("❌ Invalid escrow link.");
      setLoading(false);
      return;
    }

    try {
      // ✅ FIXED: call GET /api/escrows/:id (by escrow _id, not proposalId)
      const res = await axios.get(
        `http://localhost:5000/api/escrows/${escrowId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setEscrow(res.data);
    } catch (err) {
      console.error("Failed to load escrow", err);
      setMessage("❌ Failed to load escrow details.");
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
        <button onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );

  const statusColors = {
    "Pending Deposit": { background: "#fefcbf", color: "#744210" },
    Funded: { background: "#c6f6d5", color: "#22543d" },
    "In Progress": { background: "#bee3f8", color: "#2a4365" },
    Submitted: { background: "#e9d8fd", color: "#44337a" },
    Released: { background: "#c6f6d5", color: "#22543d" },
    Rejected: { background: "#fed7d7", color: "#742a2a" },
    Disputed: { background: "#feebc8", color: "#7b341e" },
    Refunded: { background: "#e2e8f0", color: "#2d3748" },
  };
  const statusStyle = statusColors[escrow.status] || { background: "#e2e8f0", color: "#2d3748" };

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <h2>Escrow Details</h2>

      {/* ── Summary card ── */}
      <div
        style={{
          padding: "20px",
          background: "#f7fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {escrow.projectId?.title || "Project"}
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <p style={{ margin: "4px 0", color: "#718096", fontSize: "13px" }}>Amount</p>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "18px" }}>
              ₹{escrow.amount?.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ margin: "4px 0", color: "#718096", fontSize: "13px" }}>Status</p>
            <span
              style={{
                ...statusStyle,
                padding: "4px 12px",
                borderRadius: "999px",
                fontWeight: "bold",
                fontSize: "13px",
                display: "inline-block",
              }}
            >
              {escrow.status}
            </span>
          </div>
          <div>
            <p style={{ margin: "4px 0", color: "#718096", fontSize: "13px" }}>Freelancer</p>
            <p style={{ margin: 0 }}>
              {escrow.freelancerId?.fullName || "N/A"}{" "}
              <span style={{ color: "#718096", fontSize: "12px" }}>
                ({escrow.freelancerId?.email})
              </span>
            </p>
          </div>
          <div>
            <p style={{ margin: "4px 0", color: "#718096", fontSize: "13px" }}>SME</p>
            <p style={{ margin: 0 }}>
              {escrow.smeId?.fullName || "N/A"}{" "}
              <span style={{ color: "#718096", fontSize: "12px" }}>
                ({escrow.smeId?.email})
              </span>
            </p>
          </div>
        </div>

        {/* Payment verified */}
        {escrow.paymentVerifiedAt && (
          <p style={{ marginTop: "12px", color: "#2f855a", fontSize: "13px" }}>
            ✅ Payment verified on {new Date(escrow.paymentVerifiedAt).toLocaleString()}
          </p>
        )}

        {/* Released */}
        {escrow.releasedAt && (
          <p style={{ marginTop: "4px", color: "#2f855a", fontSize: "13px" }}>
            💸 Payment released on {new Date(escrow.releasedAt).toLocaleString()}
          </p>
        )}

        {/* Rejection reason */}
        {escrow.rejectionReason && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px",
              background: "#fff5f5",
              border: "1px solid #feb2b2",
              borderRadius: "6px",
            }}
          >
            <strong style={{ color: "#c53030" }}>Rejection Reason:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{escrow.rejectionReason}</p>
          </div>
        )}

        {/* Dispute reason */}
        {escrow.disputeReason && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px",
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: "6px",
            }}
          >
            <strong style={{ color: "#d97706" }}>Dispute Reason:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{escrow.disputeReason}</p>
          </div>
        )}

        {/* Dispute resolution */}
        {escrow.disputeResolution && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px",
              background: "#f0fff4",
              border: "1px solid #9ae6b4",
              borderRadius: "6px",
            }}
          >
            <strong style={{ color: "#276749" }}>Dispute Resolution:</strong>
            <p style={{ margin: "4px 0 0 0" }}>{escrow.disputeResolution}</p>
          </div>
        )}

        {/* Submitted file */}
        {escrow.submittedFile && (
          <div style={{ marginTop: "12px" }}>
            <a
              href={`http://localhost:5000/${escrow.submittedFile}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "8px 16px",
                background: "#3182ce",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              📥 Download Submitted Work
            </a>
            {escrow.submissionComment && (
              <p style={{ marginTop: "8px", color: "#4a5568" }}>
                <strong>Comment:</strong> {escrow.submissionComment}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Timeline ── */}
      <div>
        <h4>Timeline</h4>
        <EscrowTimeline timeline={escrow.timeline} />
      </div>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: "24px",
          padding: "10px 24px",
          background: "#eee",
          color: "#333",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ← Go Back
      </button>

      {message && (
        <p style={{ color: "red", marginTop: "12px" }}>{message}</p>
      )}
    </div>
  );
}

