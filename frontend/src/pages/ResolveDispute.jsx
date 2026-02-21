import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResolveDispute() {
  const { escrowId } = useParams();
  const navigate = useNavigate();

  const [escrow, setEscrow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [resolution, setResolution] = useState("release"); // "release" | "refund"
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/escrows/${escrowId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
          }
        );
        setEscrow(res.data);
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to load escrow details");
      } finally {
        setLoading(false);
      }
    };
    fetchEscrow();
  }, [escrowId]);

  const handleResolve = async () => {
    if (!reason.trim()) return setMessage("❌ Please enter a reason for the resolution");

    setSubmitting(true);
    setMessage("");

    try {
      // ✅ FIXED: correct endpoint + correct payload keys matching backend
      const res = await axios.post(
        `http://localhost:5000/api/escrows/${escrowId}/resolve-dispute`,
        {
          resolution,           // "release" or "refund"
          refundPercentage: parseFloat(refundPercentage) || 100,
          reason,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        }
      );

      setMessage("✅ Dispute resolved successfully!");
      setTimeout(() => navigate("/dashboard/escrow-management"), 2500);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to resolve dispute";
      setMessage(`❌ ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading escrow details...</p>;
  if (!escrow && message) return <p style={{ color: "red" }}>{message}</p>;

  const refundAmount = escrow
    ? ((escrow.amount * parseFloat(refundPercentage || 0)) / 100).toFixed(2)
    : 0;

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <h1>Resolve Dispute</h1>

      {/* Escrow summary */}
      {escrow && (
        <div
          style={{
            padding: "16px",
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>⚠️ Disputed Escrow Details</h3>
          <p><strong>Project:</strong> {escrow.projectId?.title || "N/A"}</p>
          <p><strong>Freelancer:</strong> {escrow.freelancerId?.fullName} ({escrow.freelancerId?.email})</p>
          <p><strong>SME:</strong> {escrow.smeId?.fullName} ({escrow.smeId?.email})</p>
          <p><strong>Escrow Amount:</strong> ₹{escrow.amount?.toLocaleString()}</p>
          <p><strong>Dispute Reason:</strong> {escrow.disputeReason}</p>
        </div>
      )}

      {/* Resolution type */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
          Resolution Type <span style={{ color: "red" }}>*</span>
        </label>
        <div style={{ display: "flex", gap: "12px" }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="resolution"
              value="release"
              checked={resolution === "release"}
              onChange={() => setResolution("release")}
              style={{ marginRight: "6px" }}
            />
            ✅ Release Payment to Freelancer
          </label>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="resolution"
              value="refund"
              checked={resolution === "refund"}
              onChange={() => setResolution("refund")}
              style={{ marginRight: "6px" }}
            />
            💰 Refund to SME
          </label>
        </div>
      </div>

      {/* Refund percentage (only shown when refund selected) */}
      {resolution === "refund" && (
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
            Refund Percentage
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={refundPercentage}
            onChange={(e) => setRefundPercentage(e.target.value)}
            style={{
              width: "120px",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
          <span style={{ marginLeft: "12px", color: "#555" }}>
            % → Refund Amount: <strong>₹{refundAmount}</strong>
          </span>
        </div>
      )}

      {/* Reason */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
          Reason / Admin Notes <span style={{ color: "red" }}>*</span>
        </label>
        <textarea
          placeholder="Explain your decision clearly..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            fontSize: "14px",
            resize: "vertical",
          }}
          required
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={handleResolve}
          disabled={submitting}
          style={{
            padding: "10px 28px",
            background: submitting ? "#aaa" : resolution === "refund" ? "#d97706" : "#2f855a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting
            ? "Processing..."
            : resolution === "refund"
            ? `💰 Refund ₹${refundAmount} to SME`
            : "✅ Release Payment to Freelancer"}
        </button>

        <button
          onClick={() => navigate(-1)}
          disabled={submitting}
          style={{
            padding: "10px 24px",
            background: "#eee",
            color: "#333",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <p
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "6px",
            background: message.startsWith("✅") ? "#f0fff4" : "#fff5f5",
            color: message.startsWith("✅") ? "#276749" : "#c53030",
            border: `1px solid ${message.startsWith("✅") ? "#9ae6b4" : "#feb2b2"}`,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

