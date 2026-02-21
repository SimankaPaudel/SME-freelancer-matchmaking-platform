import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEscrowById, submitWork } from "../services/escrowService";

export default function SubmitWork() {
  const { proposalId } = useParams(); // ✅ changed from projectId
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
        const res = await getEscrowById(proposalId); // ✅ fetch by proposalId
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
      const res = await submitWork(escrow._id, formData); // ✅ uses escrow._id for submission
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

  if (loading) return <p>Loading escrow details...</p>;
  if (!escrow)
    return (
      <div>
        <h1>Submit Work</h1>
        <p className="error-msg">{message}</p>
        <button onClick={() => navigate("/dashboard/my-proposals")}>
          Back to My Proposals
        </button>
      </div>
    );

  const workAlreadySubmitted = ["Submitted", "Released", "Approved"].includes(
    escrow.status
  );

  return (
    <div>
      <h1>Submit Work for: {escrow.projectId?.title || "Project"}</h1>

      <div>
        <p><strong>Escrow Amount:</strong> ₹{escrow.amount}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span className={`status ${escrow.status.toLowerCase().replace(/\s+/g, "-")}`}>
            {escrow.status}
          </span>
        </p>
      </div>

      {workAlreadySubmitted ? (
        <div>
          <p className="success-msg">✅ Work already submitted.</p>
          <button onClick={() => navigate("/dashboard/my-proposals")}>
            Back to My Proposals
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input type="file" onChange={(e) => setFile(e.target.files[0])} required />
          <textarea
            placeholder="Comments (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Work"}
          </button>
          <button type="button" onClick={() => navigate("/dashboard/my-proposals")}>
            Cancel
          </button>
        </form>
      )}

      {message && <p className={message.startsWith("✅") ? "success-msg" : "error-msg"}>{message}</p>}
    </div>
  );
}
