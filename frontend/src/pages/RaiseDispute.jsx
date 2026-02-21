import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function RaiseDispute() {
  const { escrowId } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return setMessage("❌ Please enter a dispute reason");

    setLoading(true);
    setMessage("");

    try {
      // ✅ FIXED: endpoint is /raise-dispute not /dispute
      const res = await axios.post(
        `http://localhost:5000/api/escrows/${escrowId}/raise-dispute`,
        { reason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        }
      );

      setMessage("✅ Dispute raised successfully! An admin will review it shortly.");
      setTimeout(() => navigate("/dashboard/escrow-management"), 2500);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to raise dispute";
      setMessage(`❌ ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "600px" }}>
      <h1>Raise a Dispute</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Describe the issue clearly. An admin will review and resolve the dispute.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "8px" }}>
            Dispute Reason <span style={{ color: "red" }}>*</span>
          </label>
          <textarea
            placeholder="Explain the issue in detail (e.g. work does not meet requirements, communication breakdown, etc.)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
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

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 24px",
              background: loading ? "#aaa" : "#e53e3e",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loading ? "Submitting..." : "🚨 Submit Dispute"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
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
      </form>

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

