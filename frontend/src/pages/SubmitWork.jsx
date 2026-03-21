import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEscrowById, submitWork } from "../services/escrowService";
import "./Proposal.css";

export default function SubmitWork() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [escrow, setEscrow] = useState(null);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        const res = await getEscrowById(proposalId);
        setEscrow(res.data);
        if (["Submitted", "Released", "Approved"].includes(res.data.status)) {
          setMessage("Work has already been submitted for this project.");
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Escrow not created yet. Wait for SME deposit.");
        setEscrow(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEscrow();
  }, [proposalId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!escrow) return setMessage("❌ Cannot submit: escrow not created yet");
    if (!file) return setMessage("❌ Please select a file to submit");

    const allowedStatuses = ["Pending Deposit", "Funded", "In Progress"];
    if (!allowedStatuses.includes(escrow.status)) {
      return setMessage(`❌ Cannot submit. Current escrow status: ${escrow.status}`);
    }

    setSubmitting(true);
    setMessage("");

    const formData = new FormData();
    formData.append("workFile", file);
    formData.append("comment", comment);

    try {
      const res = await submitWork(escrow._id, formData);
      setMessage("✅ Work submitted successfully! Waiting for SME review.");
      setEscrow(res.data.escrow || { ...escrow, status: "Submitted" });
      setFile(null);
      setComment("");
      setTimeout(() => navigate("/dashboard/my-proposals"), 2000);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="sw-page">
      <p className="sw-loading">Loading escrow details...</p>
    </div>
  );

  if (!escrow) return (
    <div className="sw-page">
      <h1 className="sw-title">Submit Work</h1>
      <p className="sw-error">{message}</p>
      <button className="sw-btn-back" onClick={() => navigate("/dashboard/my-proposals")}>
        ← Back to My Proposals
      </button>
    </div>
  );

  const workAlreadySubmitted = ["Submitted", "Released", "Approved"].includes(escrow.status);

  const statusColors = {
    "Pending Deposit": { bg: "#fef9ec", color: "#7a5c1e", border: "#f0e0b0" },
    "Funded":          { bg: "#d4f0e0", color: "#1a5c38", border: "#a8dfc0" },
    "In Progress":     { bg: "#e8eaf8", color: "#3b2f7a", border: "#c5c8f0" },
    "Submitted":       { bg: "#fdf3e3", color: "#6b4f3f", border: "#e0d4c0" },
    "Released":        { bg: "#d4f0e0", color: "#1a5c38", border: "#a8dfc0" },
  };
  const sc = statusColors[escrow.status] || { bg: "#f7f1e8", color: "#4a3728", border: "#e0d4c0" };

  return (
    <div className="sw-page">
      <h1 className="sw-title">
        Submit Work for: <span>{escrow.projectId?.title || "Project"}</span>
      </h1>

      {/* ── Escrow summary ── */}
      <div className="sw-summary">
        <div className="sw-summary-row">
          <span className="sw-label">Escrow Amount</span>
          <span className="sw-value">₹{escrow.amount?.toLocaleString()}</span>
        </div>
        <div className="sw-summary-row">
          <span className="sw-label">Status</span>
          <span
            className="sw-status"
            style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
          >
            {escrow.status}
          </span>
        </div>
      </div>

      {/* ── Already submitted ── */}
      {workAlreadySubmitted ? (
        <div className="sw-already">
          <p className="sw-success">✅ Work already submitted. Awaiting SME review.</p>
          <button className="sw-btn-back" onClick={() => navigate("/dashboard/my-proposals")}>
            ← Back to My Proposals
          </button>
        </div>
      ) : (
        <form className="sw-form" onSubmit={handleSubmit} encType="multipart/form-data">

          {/* File upload */}
          <div className="sw-field">
            <label className="sw-field-label">Work File <span className="sw-required">*</span></label>
            <div className={`sw-file-zone ${file ? "has-file" : ""}`}>
              <input
                type="file"
                id="workFile"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              <label htmlFor="workFile" className="sw-file-btn">
                📁 Choose File
              </label>
              <span className="sw-file-name">
                {file ? `✓ ${file.name}` : "No file chosen"}
              </span>
            </div>
            <p className="sw-field-hint">Upload your completed work (PDF, ZIP, DOC, images, etc.)</p>
          </div>

          {/* Comment */}
          <div className="sw-field">
            <label className="sw-field-label" htmlFor="comment">Comments <span className="sw-optional">(optional)</span></label>
            <textarea
              id="comment"
              className="sw-textarea"
              placeholder="Add any notes or context for the SME reviewing your work..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Buttons */}
          <div className="sw-actions">
            <button type="submit" className="sw-btn-submit" disabled={submitting}>
              {submitting ? "Submitting..." : "📤 Submit Work"}
            </button>
            <button
              type="button"
              className="sw-btn-cancel"
              onClick={() => navigate("/dashboard/my-proposals")}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Feedback message ── */}
      {message && (
        <div className={`sw-message ${message.startsWith("✅") ? "success" : "error"}`}>
          {message}
        </div>
      )}
    </div>
  );
}

