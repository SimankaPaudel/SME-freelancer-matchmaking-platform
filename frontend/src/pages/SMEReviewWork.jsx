import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { approveWork, rejectWork } from "../services/escrowService";
import axios from "axios";

export default function SMEReviewWork() {
  const { escrowId } = useParams();
  const navigate = useNavigate();

  const [escrow, setEscrow] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
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
        setMessage("❌ Failed to load escrow details");
      } finally {
        setLoading(false);
      }
    };

    fetchEscrow();
  }, [escrowId]);

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this work? This will release the payment to the freelancer.")) return;

    try {
      setActionLoading(true);
      await approveWork(escrowId);
      setMessage("✅ Work approved and payment released!");
      setTimeout(() => navigate("/dashboard/escrow-management"), 2000);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to approve work";
      setMessage(`❌ ${errMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      return setMessage("❌ Please provide a reason for rejection");
    }

    if (!window.confirm("Are you sure you want to reject this submission? The freelancer will be notified.")) return;

    try {
      setActionLoading(true);
      await rejectWork(escrowId, { reason });
      setMessage("✅ Work rejected. Freelancer can resubmit or raise a dispute.");
      setTimeout(() => navigate("/dashboard/escrow-management"), 2500);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to reject work";
      setMessage(`❌ ${errMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = () => {
    navigate(`/dashboard/raise-dispute/${escrowId}`);
  };

  if (loading) return <p>Loading escrow...</p>;
  if (!escrow) return <p style={{ color: "red" }}>{message || "Escrow not found"}</p>;

  const isReleased = escrow.status === "Released";
  const isSubmitted = escrow.status === "Submitted";

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <h1>Review Submitted Work</h1>

      {/* Project / Escrow Info */}
      <div
        style={{
          padding: "16px",
          background: "#f7fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>{escrow.projectId?.title || "Project"}</h3>
        <p>
          <strong>Freelancer:</strong> {escrow.freelancerId?.fullName} (
          {escrow.freelancerId?.email})
        </p>
        <p>
          <strong>Escrow Amount:</strong> ₹{escrow.amount?.toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            style={{
              fontWeight: "bold",
              color:
                escrow.status === "Released"
                  ? "#2f855a"
                  : escrow.status === "Rejected"
                  ? "#c53030"
                  : "#2b6cb0",
            }}
          >
            {escrow.status}
          </span>
        </p>
      </div>

      {/* Submitted Work */}
      {escrow.submittedFile && (
        <div style={{ marginBottom: "16px" }}>
          <a
            href={`http://localhost:5000/${escrow.submittedFile}`}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              background: "#3182ce",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            📥 Download Submitted Work
          </a>
        </div>
      )}

      {escrow.submissionComment && (
        <div
          style={{
            padding: "12px",
            background: "#ebf8ff",
            border: "1px solid #bee3f8",
            borderRadius: "6px",
            marginBottom: "16px",
          }}
        >
          <strong>Freelancer's Comment:</strong>
          <p style={{ margin: "8px 0 0 0" }}>{escrow.submissionComment}</p>
        </div>
      )}

      {/* ── Actions ── */}
      {isReleased ? (
        <div
          style={{
            padding: "16px",
            background: "#f0fff4",
            border: "1px solid #9ae6b4",
            borderRadius: "8px",
            color: "#276749",
          }}
        >
          ✅ Payment has already been released. No further action required.
        </div>
      ) : isSubmitted ? (
        <>
          {/* Approve */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              style={{
                padding: "12px 28px",
                background: actionLoading ? "#aaa" : "#2f855a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: actionLoading ? "not-allowed" : "pointer",
                fontSize: "15px",
              }}
            >
              {actionLoading ? "Processing..." : "✅ Approve Work & Release Payment"}
            </button>
          </div>

          {/* Reject */}
          <div
            style={{
              padding: "16px",
              background: "#fff5f5",
              border: "1px solid #feb2b2",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ marginTop: 0, color: "#c53030" }}>❌ Reject Submission</h4>
            <textarea
              placeholder="Provide a detailed reason for rejection (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "14px",
                resize: "vertical",
                marginBottom: "10px",
              }}
            />
            <button
              onClick={handleReject}
              disabled={actionLoading}
              style={{
                padding: "10px 24px",
                background: actionLoading ? "#aaa" : "#e53e3e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: actionLoading ? "not-allowed" : "pointer",
              }}
            >
              {actionLoading ? "Processing..." : "❌ Reject Work"}
            </button>
          </div>

          {/* Raise dispute */}
          <div style={{ marginBottom: "16px" }}>
            <button
              onClick={handleRaiseDispute}
              disabled={actionLoading}
              style={{
                padding: "10px 24px",
                background: "#dd6b20",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              🚨 Raise a Dispute
            </button>
            <p style={{ fontSize: "12px", color: "#718096", marginTop: "6px" }}>
              Use this if you believe there is a serious issue that requires admin intervention.
            </p>
          </div>
        </>
      ) : (
        <div style={{ color: "#718096" }}>
          <p>Current status: <strong>{escrow.status}</strong></p>
          <p>No actions available for this status.</p>
        </div>
      )}

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

      {/* Back button */}
      <button
        onClick={() => navigate("/dashboard/escrow-management")}
        style={{
          marginTop: "20px",
          padding: "10px 24px",
          background: "#eee",
          color: "#333",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ← Back to Escrow Management
      </button>
    </div>
  );
}

