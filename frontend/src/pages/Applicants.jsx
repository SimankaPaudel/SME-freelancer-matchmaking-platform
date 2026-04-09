import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import RatingDisplay from "../components/RatingDisplay";
import "./Proposal.css";

export default function Applicants() {
  const { state } = useLocation();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date"); // date, price-asc, price-desc, rating-high, rating-low, status
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null); // for profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    if (!state?.projectId) return;

    const fetchApplicants = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/proposals/project/${state.projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch applicants");

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
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
    
    // Auto-refresh all proposals every 5 seconds to pick up review updates
    const refreshInterval = setInterval(fetchApplicants, 5000);
    
    return () => clearInterval(refreshInterval);
  }, [state?.projectId, token]);

  // ── Sorting Logic ──
  const getSortedProposals = () => {
    const sorted = [...proposals];
    let result;
    
    switch (sortBy) {
      case "price-asc":
        result = sorted.sort((a, b) => a.bidAmount - b.bidAmount);
        break;
      case "price-desc":
        result = sorted.sort((a, b) => b.bidAmount - a.bidAmount);
        break;
      case "rating-high":
        // HIGHEST RATED: Rated freelancers first (sorting by rating desc), then unrated
        result = sorted.sort((a, b) => {
          const aReviews = a.freelancerId?.totalReviews || 0;
          const bReviews = b.freelancerId?.totalReviews || 0;
          const aRating = a.freelancerId?.averageRating || 0;
          const bRating = b.freelancerId?.averageRating || 0;
          
          // If one has reviews and other doesn't, rated comes first
          if ((aReviews > 0) !== (bReviews > 0)) {
            return (bReviews > 0) ? 1 : -1;  // b has reviews → b first (return positive)
          }
          
          // Both have same review status (both rated or both unrated), sort by rating
          return bRating - aRating;  // Higher rating first
        });
        break;
      case "rating-low":
        // LOWEST RATED: Unrated freelancers first, then lowest rated ones
        result = sorted.sort((a, b) => {
          const aReviews = a.freelancerId?.totalReviews || 0;
          const bReviews = b.freelancerId?.totalReviews || 0;
          const aRating = a.freelancerId?.averageRating || 0;
          const bRating = b.freelancerId?.averageRating || 0;
          
          // If one has reviews and other doesn't, unrated comes first
          if ((aReviews > 0) !== (bReviews > 0)) {
            return (aReviews > 0) ? 1 : -1;  // a has reviews → b first (return positive/put a second)
          }
          
          // Both have same review status (both rated or both unrated), sort by rating ascending
          return aRating - bRating;  // Lower rating first
        });
        break;
      case "rating":
        // Backward compatibility
        result = sorted.sort((a, b) => (b.freelancerId?.averageRating || 0) - (a.freelancerId?.averageRating || 0));
        break;
      case "status":
        const statusOrder = { "Shortlisted": 0, "Submitted": 1, "Viewed": 2, "Rejected": 3 };
        result = sorted.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
        break;
      case "date":
      default:
        result = sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    return result;
  };

  const toggleSelectProposal = (id) => {
    setSelectedProposals(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const getSelectedProposalsData = () => {
    return proposals.filter(p => selectedProposals.includes(p._id));
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/proposals/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const data = await res.json();

      setProposals((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, status, escrow: data.escrow || p.escrow }
            : p
        )
      );

      if (status === "Accepted") {
        alert(
          "Proposal accepted! Escrow has been created. Please deposit funds to activate the project."
        );
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

  const sortedProposals = getSortedProposals();
  const comparisonData = getSelectedProposalsData();

  return (
    <div className="page-container">
      <h1>Applicants</h1>

      {proposals.length === 0 && <p>No applicants yet.</p>}

      {proposals.length > 0 && (
        <>
          {/* ── Toolbar ── */}
          <div style={{
            background: "#f7f1e8",
            border: "1px solid #e0d4c0",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}>
            <div>
              <label style={{ fontWeight: "bold", marginRight: "8px" }}>Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e0d4c0",
                  borderRadius: "6px",
                  background: "#ffffff",
                  cursor: "pointer"
                }}
              >
                <option value="date">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-high">⭐ Highest Rated</option>
                <option value="rating-low">⭐ Lowest Rated</option>
                <option value="status">Status</option>
              </select>
            </div>

            {selectedProposals.length > 1 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                style={{
                  padding: "8px 16px",
                  background: "#b08968",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Compare ({selectedProposals.length})
              </button>
            )}
          </div>

          {/* ── Proposals List ── */}
          {sortedProposals.map((p) => (
            <div className="proposal-card" key={p._id} style={{ position: "relative" }}>
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedProposals.includes(p._id)}
                onChange={() => toggleSelectProposal(p._id)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer"
                }}
              />

              {/* Freelancer Info with Profile */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px 0" }}>{p.freelancerId?.fullName || "Freelancer Removed"}</h3>
                  <p style={{ margin: "2px 0", color: "#7a6a55", fontSize: "13px" }}>
                    ✉️ {p.freelancerId?.email || "N/A"}
                  </p>
                  
                  {/* Rating & Review Count */}
                  {p.freelancerId?.totalReviews > 0 ? (
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#d68910", fontWeight: "600" }}>
                      ⭐ {(p.freelancerId.averageRating || 0).toFixed(1)} / 5 
                      <span style={{ color: "#7a6a55", marginLeft: "6px", fontWeight: "normal" }}>({p.freelancerId.totalReviews} review{p.freelancerId.totalReviews !== 1 ? "s" : ""})</span>
                    </p>
                  ) : (
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#a89880", fontStyle: "italic" }}>
                      ☆ No reviews yet
                    </p>
                  )}
                  
                  {/* Skills Preview */}
                  {p.freelancerId?.skills?.length > 0 && (
                    <div style={{ marginTop: "6px" }}>
                      {p.freelancerId.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} style={{
                          display: "inline-block",
                          background: "#fdf3e3",
                          color: "#6b4f3f",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          marginRight: "6px",
                          border: "1px solid #e0d4c0"
                        }}>
                          {skill}
                        </span>
                      ))}
                      {p.freelancerId.skills.length > 3 && (
                        <span style={{ fontSize: "12px", color: "#a89880" }}>
                          +{p.freelancerId.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* View Profile Button */}
                <button
                  onClick={() => { setSelectedFreelancer(p.freelancerId); setShowProfileModal(true); }}
                  style={{
                    padding: "6px 12px",
                    background: "#e9dcc7",
                    border: "1px solid #e0d4c0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    marginLeft: "12px",
                    whiteSpace: "nowrap"
                  }}
                >
                  View Profile
                </button>
              </div>

              {/* Bid & Description */}
              <p style={{ margin: "6px 0" }}>
                <strong>Bid Amount:</strong> ₹{p.bidAmount?.toLocaleString()}
              </p>

              <p style={{ margin: "6px 0", color: "#7a6a55" }}>
                <strong>Description:</strong> {p.description}
              </p>

              {/* Files */}
              <div style={{ margin: "10px 0" }}>
                {p.proposalFile && (
                  <p style={{ margin: "4px 0" }}>
                    <a href={`http://localhost:5000/${p.proposalFile}`} download target="_blank" rel="noopener noreferrer" style={{ color: "#b08968" }}>
                      Proposal Document
                    </a>
                  </p>
                )}
                {p.cvFile && (
                  <p style={{ margin: "4px 0" }}>
                    <a href={`http://localhost:5000/${p.cvFile}`} download target="_blank" rel="noopener noreferrer" style={{ color: "#b08968" }}>
                      CV/Resume
                    </a>
                  </p>
                )}
              </div>

              <span className={`status ${p.status.toLowerCase()}`} style={{ display: "inline-block", marginBottom: "10px" }}>
                {p.status}
              </span>

              {/* Action buttons */}
              <div className="actions">
                {p.status !== "Accepted" && (
                  <>
                    {p.status !== "Shortlisted" && (
                      <button onClick={() => updateStatus(p._id, "Shortlisted")} style={{ padding: "8px 14px", background: "#fdf3e3", border: "1px solid #e0d4c0", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
                        ⭐ Shortlist
                      </button>
                    )}

                    <button
                      onClick={() => updateStatus(p._id, "Accepted")}
                      style={{ padding: "8px 14px", background: "#d4f0e0", border: "1px solid #a8dfc0", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#1a5c38" }}
                    >
                      ✅ Accept
                    </button>

                    {p.status !== "Rejected" && (
                      <button
                        onClick={() => updateStatus(p._id, "Rejected")}
                        style={{ padding: "8px 14px", background: "#f8d7da", border: "1px solid #f5c6c0", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#721c24" }}
                      >
                        ❌ Reject
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Chat button */}
              {p.status === "Accepted" && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => navigate(`/dashboard/chat/${state.projectId}`)}
                    style={{ padding: "8px 14px", background: "#b08968", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                  >
                    Chat with Freelancer
                  </button>
                </div>
              )}

              {/* Escrow section */}
              {p.status === "Accepted" && (
                <div style={{ marginTop: "10px", padding: "10px", background: "#fef9ec", border: "1px solid #f0e0b0", borderRadius: "6px" }}>
                  {p.escrow ? (
                    <>
                      <p style={{ margin: "4px 0", fontSize: "13px", fontWeight: "600" }}>
                        Escrow: <strong style={{ color: p.escrow.status === "Pending Deposit" ? "#7a5c1e" : "#1a5c38" }}>{p.escrow.status}</strong> | ₹{p.escrow.amount}
                      </p>
                      {p.escrow.status === "Pending Deposit" && (
                        <p style={{ margin: "4px 0", fontSize: "12px", color: "#c0392b" }}>
                          ⚠️ Awaiting deposit
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{ margin: "0", fontSize: "13px", color: "#7a5c1e" }}>Escrow created. Please deposit funds.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── Profile Modal ── */}
      {showProfileModal && selectedFreelancer && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }} onClick={() => setShowProfileModal(false)}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "28px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 16px 0", color: "#4a3728" }}>{selectedFreelancer.fullName}</h2>

            <div style={{ marginBottom: "16px" }}>
                <p><strong>Email:</strong> {selectedFreelancer.email}</p>
              {selectedFreelancer.hourlyRate && (
                <p><strong>Hourly Rate:</strong> ₹{selectedFreelancer.hourlyRate.toLocaleString()}/hr</p>
              )}
            </div>

            <RatingDisplay userId={selectedFreelancer._id} />

            {selectedFreelancer.bio && (
              <div style={{ background: "#f7f1e8", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
                <strong>Bio:</strong> {selectedFreelancer.bio}
              </div>
            )}

            {selectedFreelancer.skills?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <strong>Skills:</strong>
                <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedFreelancer.skills.map((skill, i) => (
                    <span key={i} style={{
                      background: "#fdf3e3",
                      color: "#6b4f3f",
                      padding: "4px 10px",
                      borderRadius: "14px",
                      fontSize: "13px",
                      border: "1px solid #e0d4c0"
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedFreelancer.portfolio?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <strong>Portfolio:</strong>
                <div style={{ marginTop: "8px" }}>
                  {selectedFreelancer.portfolio.map((item, i) => (
                    <div key={i} style={{ background: "#f7f1e8", padding: "10px", borderRadius: "6px", marginBottom: "8px" }}>
                      <p style={{ margin: "0 0 4px 0", fontWeight: "600" }}>{item.title}</p>
                      {item.description && <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#7a6a55" }}>{item.description}</p>}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: "#b08968", fontSize: "13px" }}>
                          View Project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#b08968",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Comparison Modal ── */}
      {showComparisonModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }} onClick={() => setShowComparisonModal(false)}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "28px",
            maxWidth: "900px",
            width: "95%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px 0", color: "#4a3728" }}>Proposal Comparison</h2>

            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px"
              }}>
                <thead>
                  <tr style={{ background: "#f7f1e8", borderBottom: "2px solid #e0d4c0" }}>
                    <th style={{ padding: "10px", textAlign: "left", fontWeight: "700" }}>Freelancer</th>
                    {comparisonData.map(p => (
                      <th key={p._id} style={{ padding: "10px", textAlign: "center", fontWeight: "700", borderLeft: "1px solid #e0d4c0" }}>
                        {p.freelancerId?.fullName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e0d4c0" }}>
                    <td style={{ padding: "10px", fontWeight: "600" }}>Bid Amount</td>
                    {comparisonData.map(p => (
                      <td key={p._id} style={{ padding: "10px", textAlign: "center", borderLeft: "1px solid #e0d4c0" }}>
                        ₹{p.bidAmount?.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e0d4c0" }}>
                    <td style={{ padding: "10px", fontWeight: "600" }}>Rating</td>
                    {comparisonData.map(p => (
                      <td key={p._id} style={{ padding: "10px", textAlign: "center", borderLeft: "1px solid #e0d4c0" }}>
                        ⭐ {(p.freelancerId?.averageRating || 0).toFixed(1)}/5
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e0d4c0" }}>
                    <td style={{ padding: "10px", fontWeight: "600" }}>Reviews</td>
                    {comparisonData.map(p => (
                      <td key={p._id} style={{ padding: "10px", textAlign: "center", borderLeft: "1px solid #e0d4c0" }}>
                        {p.freelancerId?.totalReviews || 0}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e0d4c0" }}>
                    <td style={{ padding: "10px", fontWeight: "600" }}>Status</td>
                    {comparisonData.map(p => (
                      <td key={p._id} style={{ padding: "10px", textAlign: "center", borderLeft: "1px solid #e0d4c0" }}>
                        <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: "10px", fontWeight: "600" }}>Skills Count</td>
                    {comparisonData.map(p => (
                      <td key={p._id} style={{ padding: "10px", textAlign: "center", borderLeft: "1px solid #e0d4c0" }}>
                        {p.freelancerId?.skills?.length || 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowComparisonModal(false)}
              style={{
                marginTop: "16px",
                width: "100%",
                padding: "10px",
                background: "#b08968",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Close Comparison
            </button>
          </div>
        </div>
      )}
    </div>
  );
}