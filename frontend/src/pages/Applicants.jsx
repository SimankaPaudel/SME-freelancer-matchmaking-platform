import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./proposal.css";

export default function Applicants() {
  const { state } = useLocation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state?.projectId) return;

    const fetchApplicants = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/proposals/project/${state.projectId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch applicants");

        const data = await res.json();

        // ✅ FIXED: Fetch escrow for accepted proposals
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
                  
                  // Handle both formats
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
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [state?.projectId]);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/proposals/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const data = await res.json();

      // ✅ FIXED: Update state with escrow data from response
      setProposals((prev) =>
        prev.map((p) =>
          p._id === id
            ? { 
                ...p, 
                status, 
                escrow: data.escrow || p.escrow 
              }
            : p
        )
      );

      // Show success message
      if (status === "Accepted") {
        alert("Proposal accepted! Escrow has been created. Please deposit funds to activate the project.");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Applicants</h1>

      {proposals.length === 0 && <p>No applicants yet.</p>}

      {proposals.map((p) => (
        <div className="proposal-card" key={p._id}>
          <h3>{p.freelancerId?.fullName || "Freelancer Removed"}</h3>
          <p>
            <strong>Email:</strong> {p.freelancerId?.email || "N/A"}
          </p>
          <p>
            <strong>Bid Amount:</strong> ₹{p.bidAmount}
          </p>
          <p>
            <strong>Description:</strong> {p.description}
          </p>

          {p.proposalFile && (
            <p>
              <strong>Proposal:</strong>{" "}
              <a
                href={`http://localhost:5000/${p.proposalFile}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="file-link"
              >
                📄 {p.proposalFileName || "Download Proposal"}
              </a>
            </p>
          )}

          {p.cvFile && (
            <p>
              <strong>CV:</strong>{" "}
              <a
                href={`http://localhost:5000/${p.cvFile}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="file-link"
              >
                📄 {p.cvFileName || "Download CV"}
              </a>
            </p>
          )}

          <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>

          {/* ✅ Action buttons - disable after accepted */}
          <div className="actions">
            {p.status !== "Accepted" && (
              <>
                {p.status !== "Shortlisted" && (
                  <button onClick={() => updateStatus(p._id, "Shortlisted")}>
                    ⭐ Shortlist
                  </button>
                )}
                <button 
                  onClick={() => updateStatus(p._id, "Accepted")}
                  className="success"
                >
                  ✅ Accept
                </button>
                {p.status !== "Rejected" && (
                  <button
                    className="danger"
                    onClick={() => updateStatus(p._id, "Rejected")}
                  >
                    ❌ Reject
                  </button>
                )}
              </>
            )}
          </div>

          {/* ✅ FIXED: Show escrow info for accepted proposals */}
          {p.status === "Accepted" && (
            <div className="escrow-info-section">
              {p.escrow ? (
                <>
                  <p className="escrow-info">
                    💰 Escrow Status: <strong>{p.escrow.status}</strong> | Amount: ₹{p.escrow.amount}
                  </p>
                  {p.escrow.status === "Pending Deposit" && (
                    <p className="warning-text">
                      ⚠️ Please deposit escrow funds to activate this project
                    </p>
                  )}
                </>
              ) : (
                <p className="info-text">
                  ✅ Proposal accepted! Escrow created. Please deposit funds.
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

