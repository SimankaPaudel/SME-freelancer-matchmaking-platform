import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./proposal.css";

export default function ApplyProposal() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [bidAmount, setBidAmount] = useState("");
  const [description, setDescription] = useState("");
  const [proposalFile, setProposalFile] = useState(null);
  const [cvFile, setCVFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitProposal = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!proposalFile || !cvFile) {
      setError("Both proposal and CV files are required");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("bidAmount", bidAmount);
      formData.append("description", description);
      formData.append("proposalFile", proposalFile);
      formData.append("cvFile", cvFile);

      const res = await fetch("http://localhost:5000/api/proposals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to submit proposal");

      navigate("/dashboard/my-proposals");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Apply for Project</h1>
      <form className="proposal-form" onSubmit={submitProposal}>
        {/* ✅ FIXED: Label shows NPR */}
        <div className="form-group">
          <label htmlFor="bidAmount">Bid Amount (NPR - ₹)</label>
          <input
            id="bidAmount"
            type="number"
            placeholder="Enter amount in Nepali Rupees"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
            min="1"
          />
        </div>

        <textarea
          placeholder="Proposal Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="5"
          required
        />
        
        {/* Proposal File Upload */}
        <div className="file-input-wrapper">
          <label htmlFor="proposalFile" className="file-label">
            Proposal Document (PDF/DOC/DOCX)
          </label>
          <input
            id="proposalFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setProposalFile(e.target.files[0])}
            required
          />
          {proposalFile && (
            <span className="file-name">Selected: {proposalFile.name}</span>
          )}
        </div>

        {/* CV File Upload */}
        <div className="file-input-wrapper">
          <label htmlFor="cvFile" className="file-label">
            CV/Resume (PDF/DOC/DOCX)
          </label>
          <input
            id="cvFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCVFile(e.target.files[0])}
            required
          />
          {cvFile && (
            <span className="file-name">Selected: {cvFile.name}</span>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Proposal"}
        </button>
        {error && <p className="error-msg">{error}</p>}
      </form>
    </div>
  );
}

