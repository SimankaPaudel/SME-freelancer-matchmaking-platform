import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Proposal.css";

export default function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchProposals();
  }, [token]);

  const fetchProposals = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/proposals/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch proposals");

      const data = await res.json();

      const dataWithEscrow = await Promise.all(
        data.map(async (p) => {
          if (p.status === "Accepted") {
            try {
              const escrowRes = await fetch(
                `http://localhost:5000/api/escrows/proposal/${p._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (escrowRes.ok) {
                const escrowData = await escrowRes.json();

                if (escrowData.escrow === null)
                  return { ...p, escrow: null };
                else if (escrowData._id)
                  return { ...p, escrow: escrowData };
                else if (escrowData.escrow)
                  return { ...p, escrow: escrowData.escrow };
              }

              return { ...p, escrow: null };
            } catch (err) {
              console.error(
                `Error fetching escrow for proposal ${p._id}:`,
                err
              );
              return { ...p, escrow: null };
            }
          }
          return p;
        })
      );

      setProposals(dataWithEscrow);
    } catch (err) {
      console.error(err);
      setError("Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = (proposalId) =>
    navigate(`/dashboard/submit-work/${proposalId}`);

  const handleViewEscrow = (escrowId) =>
    navigate(`/dashboard/escrow/${escrowId}`);

  const toggleEditMode = (proposal) => {
    if (editingId === proposal._id) {
      setEditingId(null);
      setEditForm({});
    } else {
      setEditingId(proposal._id);
      setEditForm({
        bidAmount: proposal.bidAmount,
        description: proposal.description,
        proposalFile: null,
        cvFile: null,
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files?.[0];
    setEditForm((prev) => ({
      ...prev,
      [fileType]: file,
    }));
  };

  const saveProposalChanges = async (proposalId) => {
    try {
      // Validate
      if (!editForm.bidAmount || isNaN(Number(editForm.bidAmount)) || Number(editForm.bidAmount) <= 0) {
        alert("Bid amount must be a positive number");
        return;
      }
      if (!editForm.description?.trim()) {
        alert("Description is required");
        return;
      }

      const formData = new FormData();
      formData.append("bidAmount", Number(editForm.bidAmount));
      formData.append("description", editForm.description.trim());

      if (editForm.proposalFile) {
        formData.append("proposalFile", editForm.proposalFile);
      }
      if (editForm.cvFile) {
        formData.append("cvFile", editForm.cvFile);
      }

      const res = await fetch(`http://localhost:5000/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update proposal");

      setProposals((prev) =>
        prev.map((p) => (p._id === proposalId ? { ...p, ...data.proposal } : p))
      );

      setEditingId(null);
      setEditForm({});
      alert("Proposal updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update proposal: " + err.message);
    }
  };

  const handleCancelProposal = async (proposalId) => {
    if (!window.confirm("Are you sure you want to cancel this proposal? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/proposals/${proposalId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel proposal");

      setProposals((prev) =>
        prev.map((p) => (p._id === proposalId ? { ...p, status: "Cancelled" } : p))
      );

      alert("Proposal cancelled successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to cancel proposal: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="page-container">
        <p>Loading your proposals...</p>
      </div>
    );

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ margin: "0" }}>My Proposals</h1>
        <button
          onClick={() => navigate("/dashboard/proposal-analytics")}
          style={{
            padding: "10px 18px",
            background: "#b08968",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "13px",
            whiteSpace: "nowrap"
          }}
        >
          View Analytics
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {proposals.length === 0 && !error && (
        <p>No proposals submitted yet.</p>
      )}

      {proposals.map((p) => (
        <div className="proposal-card" key={p._id}>
          {editingId === p._id ? (
            <div className="edit-form">
              <h3>Edit Proposal</h3>
              <div className="form-group">
                <label>Bid Amount (₹):</label>
                <input
                  type="number"
                  name="bidAmount"
                  value={editForm.bidAmount || ""}
                  onChange={handleEditChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={editForm.description || ""}
                  onChange={handleEditChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Proposal Document (PDF/DOC/DOCX):</label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "proposalFile")}
                  accept=".pdf,.doc,.docx"
                />
                {editForm.proposalFile && <small>New file selected: {editForm.proposalFile.name}</small>}
              </div>

              <div className="form-group">
                <label>CV (PDF/DOC/DOCX):</label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "cvFile")}
                  accept=".pdf,.doc,.docx"
                />
                {editForm.cvFile && <small>New file selected: {editForm.cvFile.name}</small>}
              </div>

              <div className="edit-actions">
                <button
                  className="success"
                  onClick={() => saveProposalChanges(p._id)}
                >
                  Save Changes
                </button>
                <button
                  className="cancel"
                  onClick={() => toggleEditMode(p)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3>{p.projectId?.title || "Project Removed"}</h3>

              <div className="proposal-details">
                <p>
                  <strong>Bid Amount:</strong> ₹
                  {p.bidAmount?.toLocaleString()}
                </p>

                <p>
                  <strong>Description:</strong> {p.description}
                </p>

                {p.projectId && (
                  <>
                    <p>
                      <strong>Budget Range:</strong> ₹
                      {p.projectId.budgetMin?.toLocaleString()} - ₹
                      {p.projectId.budgetMax?.toLocaleString()}
                    </p>

                    {p.projectId.deadline && (
                      <p>
                        <strong>Project Deadline:</strong>{" "}
                        {new Date(
                          p.projectId.deadline
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </>
                )}

                <p>
                  <strong>Submitted On:</strong>{" "}
                  {new Date(p.createdAt).toLocaleDateString()}
                </p>
              </div>

              {(p.proposalFile || p.cvFile) && (
                <div className="files-section">
                  <h4>📎 Attached Files:</h4>

                  {p.proposalFile && (
                    <p>
                      <span className="file-label">Proposal:</span>{" "}
                      <a
                        href={`http://localhost:5000/${p.proposalFile}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        {p.proposalFileName || "Download Proposal"}
                      </a>
                    </p>
                  )}

                  {p.cvFile && (
                    <p>
                      <span className="file-label">CV:</span>{" "}
                      <a
                        href={`http://localhost:5000/${p.cvFile}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        {p.cvFileName || "Download CV"}
                      </a>
                    </p>
                  )}
                </div>
              )}

              <span className={`status ${p.status.toLowerCase()}`}>
                {p.status}
              </span>

              {/* Edit Button - only when status is Submitted */}
              {p.status === "Submitted" && (
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => toggleEditMode(p)}
                    style={{
                      padding: "9px 16px",
                      background: "#b08968",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#9d7559"}
                    onMouseLeave={(e) => e.target.style.background = "#b08968"}
                  >
                    ✏️ Edit Proposal
                  </button>
                  <button
                    onClick={() => handleCancelProposal(p._id)}
                    style={{
                      padding: "9px 16px",
                      background: "#c0392b",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "13px",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "#a02d24"}
                    onMouseLeave={(e) => e.target.style.background = "#c0392b"}
                  >
                    ❌ Cancel Proposal
                  </button>
                </div>
              )}

              {/* Chat Button */}
              {p.status === "Accepted" && p.projectId?._id && (
                <div style={{ marginTop: 10 }}>
                  <button
                    className="chat-btn"
                    onClick={() =>
                      navigate(`/dashboard/chat/${p.projectId._id}`)
                    }
                  >
                    💬 Chat with SME
                  </button>
                </div>
              )}

              {/* Escrow Section */}
              {p.status === "Accepted" && (
                <div className="escrow-section">
                  {p.escrow ? (
                    <>
                      <p className="escrow-info">
                        💰 Escrow Status:{" "}
                        <strong>{p.escrow.status}</strong> | Amount: ₹
                        {p.escrow.amount?.toLocaleString()}
                      </p>

                      {[
                        "Funded",
                        "In Progress",
                      ].includes(p.escrow.status) && (
                        <div className="action-section">
                          <button
                            className="submit-work-btn"
                            onClick={() =>
                              handleSubmitWork(p._id)
                            }
                          >
                            📤 Submit Work
                          </button>
                        </div>
                      )}

                      {p.escrow.status === "Pending Deposit" && (
                        <p className="info-text">
                          ⏳ Waiting for SME to deposit escrow
                          funds...
                        </p>
                      )}

                      {[
                        "Submitted",
                        "Released",
                        "Approved",
                        "Disputed",
                      ].includes(p.escrow.status) && (
                        <div className="action-section">
                          <button
                            className="view-escrow-btn"
                            onClick={() =>
                              handleViewEscrow(p.escrow._id)
                            }
                          >
                            👁️ View Escrow Details
                          </button>

                          <p className="info-text">
                            {p.escrow.status === "Submitted" &&
                              "⏳ Waiting for SME review..."}
                            {p.escrow.status === "Released" &&
                              "✅ Payment released!"}
                            {p.escrow.status === "Disputed" &&
                              "⚠️ In dispute resolution"}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="escrow-pending">
                      <p className="warning-text">
                        ⏳ Proposal accepted! Waiting for SME to
                        create escrow and deposit funds...
                      </p>

                      <p className="info-text">
                        You'll be able to submit work once the
                        escrow is funded.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
