import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./proposal.css";

export default function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/proposals/mine", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch proposals");

        const data = await res.json();

        // Fetch escrow by proposal ID for accepted proposals
        const dataWithEscrow = await Promise.all(
          data.map(async (p) => {
            if (p.status === "Accepted") {
              try {
                const escrowRes = await fetch(
                  `http://localhost:5000/api/escrows/proposal/${p._id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                      )}`,
                    },
                  }
                );

                if (escrowRes.ok) {
                  const escrowData = await escrowRes.json();
                  
                  if (escrowData.escrow === null) {
                    return { ...p, escrow: null };
                  } else if (escrowData._id) {
                    return { ...p, escrow: escrowData };
                  } else if (escrowData.escrow) {
                    return { ...p, escrow: escrowData.escrow };
                  }
                }
                
                return { ...p, escrow: null };
              } catch (err) {
                console.error(`Error fetching escrow for proposal ${p._id}:`, err);
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

    fetchProposals();
  }, []);

  const handleSubmitWork = (proposalId) => {
    navigate(`/dashboard/submit-work/${proposalId}`);
  };

  const handleViewEscrow = (escrowId) => {
    navigate(`/dashboard/escrow/${escrowId}`);
  };

  if (loading)
    return (
      <div className="page-container">
        <p>Loading your proposals...</p>
      </div>
    );

  return (
    <div className="page-container">
      <h1>My Proposals</h1>

      {error && <p className="error-msg">{error}</p>}
      {proposals.length === 0 && !error && <p>No proposals submitted yet.</p>}

      {proposals.map((p) => (
        <div className="proposal-card" key={p._id}>
          <h3>{p.projectId?.title || "Project Removed"}</h3>

          <div className="proposal-details">
            {/* ✅ FIXED: Show in NPR */}
            <p>
              <strong>Bid Amount:</strong> ₹{p.bidAmount?.toLocaleString()}
            </p>
            <p>
              <strong>Description:</strong> {p.description}
            </p>

            {p.projectId && (
              <>
                {/* ✅ FIXED: Show in NPR */}
                <p>
                  <strong>Budget Range:</strong> ₹{p.projectId.budgetMin?.toLocaleString()} - ₹{p.projectId.budgetMax?.toLocaleString()}
                </p>
                {p.projectId.deadline && (
                  <p>
                    <strong>Project Deadline:</strong>{" "}
                    {new Date(p.projectId.deadline).toLocaleDateString()}
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

          <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>

          {/* Escrow actions */}
          {p.status === "Accepted" && (
            <div className="escrow-section">
              {p.escrow ? (
                <>
                  {/* ✅ FIXED: Amount already in NPR, just display it */}
                  <p className="escrow-info">
                    💰 Escrow Status: <strong>{p.escrow.status}</strong> | Amount: ₹{p.escrow.amount?.toLocaleString()}
                  </p>
                  
                  {/* Show submit button for these states */}
                  {["Pending Deposit", "Funded", "In Progress"].includes(p.escrow.status) && (
                    <div className="action-section">
                      <button
                        className="submit-work-btn"
                        onClick={() => handleSubmitWork(p._id)}
                      >
                        📤 Submit Work
                      </button>
                      {p.escrow.status === "Pending Deposit" && (
                        <p className="info-text">
                          ⏳ Waiting for SME to deposit escrow funds...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Show view button for completed states */}
                  {["Submitted", "Released", "Approved", "Disputed"].includes(p.escrow.status) && (
                    <div className="action-section">
                      <button
                        className="view-escrow-btn"
                        onClick={() => handleViewEscrow(p.escrow._id)}
                      >
                        👁️ View Escrow Details
                      </button>
                      <p className="info-text">
                        {p.escrow.status === "Submitted" && "⏳ Waiting for SME review..."}
                        {p.escrow.status === "Released" && "✅ Payment released!"}
                        {p.escrow.status === "Disputed" && "⚠️ In dispute resolution"}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="escrow-pending">
                  <p className="warning-text">
                    ⏳ Proposal accepted! Waiting for SME to create escrow and deposit funds...
                  </p>
                  <p className="info-text">
                    You'll be able to submit work once the escrow is funded.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

