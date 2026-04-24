import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Proposal.css";

export default function ProposalAnalytics() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_BASE_URL}/proposals/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch proposals");
        const data = await res.json();
        setProposals(data);
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [token]);

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading analytics...</p>
      </div>
    );
  }

  // â”€â”€ Metrics â”€â”€
  const totalProposals = proposals.length;
  const acceptedCount = proposals.filter(p => p.status === "Accepted").length;
  const rejectedCount = proposals.filter(p => p.status === "Rejected").length;
  const shortlistedCount = proposals.filter(p => p.status === "Shortlisted").length;
  const submittedCount = proposals.filter(p => p.status === "Submitted").length;
  const viewedCount = proposals.filter(p => p.status === "Viewed").length;

  const acceptanceRate = totalProposals > 0 ? ((acceptedCount / totalProposals) * 100).toFixed(1) : 0;
  const rejectionRate = totalProposals > 0 ? ((rejectedCount / totalProposals) * 100).toFixed(1) : 0;

  const averageBid = totalProposals > 0
    ? (proposals.reduce((sum, p) => sum + (p.bidAmount || 0), 0) / totalProposals).toFixed(0)
    : 0;

  const minBid = totalProposals > 0 ? Math.min(...proposals.map(p => p.bidAmount || 0)) : 0;
  const maxBid = totalProposals > 0 ? Math.max(...proposals.map(p => p.bidAmount || 0)) : 0;

  return (
    <div className="page-container">
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 8px 0" }}>ðŸ“Š Proposal Analytics</h1>
        <p style={{ margin: "0", color: "#7a6a55", fontSize: "14px" }}>
          Track your proposal performance and bidding statistics
        </p>
      </div>

      {/* â”€â”€ Key Metrics Grid â”€â”€ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "28px"
      }}>
        {/* Total Proposals */}
        <div style={{
          background: "linear-gradient(135deg, #faf8f5 0%, #f2ede5 100%)",
          border: "2px solid #e0d4c0",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#4a3728", marginBottom: "4px" }}>
            {totalProposals}
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#a89880", textTransform: "uppercase" }}>
            Total Proposals
          </div>
        </div>

        {/* Acceptance Rate */}
        <div style={{
          background: "linear-gradient(135deg, #d4f0e0 0%, #e8f7ed 100%)",
          border: "2px solid #a8dfc0",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#1a5c38", marginBottom: "4px" }}>
            {acceptanceRate}%
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#2d7659", textTransform: "uppercase" }}>
            Acceptance Rate
          </div>
        </div>

        {/* Average Bid */}
        <div style={{
          background: "linear-gradient(135deg, #fff8f0 0%, #ffe8d6 100%)",
          border: "2px solid #f0a500",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#7a5c1e", marginBottom: "4px" }}>
            â‚¹{averageBid}
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#9a7a3e", textTransform: "uppercase" }}>
            Average Bid
          </div>
        </div>

        {/* Shortlisted */}
        <div style={{
          background: "linear-gradient(135deg, #fdf3e3 0%, #f5e5c8 100%)",
          border: "2px solid #e0d4c0",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "#6b4f3f", marginBottom: "4px" }}>
            {shortlistedCount}
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#a89880", textTransform: "uppercase" }}>
            Shortlisted
          </div>
        </div>
      </div>

      {/* â”€â”€ Bid Range â”€â”€ */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e0d4c0",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "28px"
      }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#4a3728" }}>ðŸ’° Bidding Statistics</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px"
        }}>
          <div>
            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: "700", color: "#a89880", textTransform: "uppercase" }}>
              Minimum Bid
            </p>
            <p style={{ margin: "0", fontSize: "20px", fontWeight: "800", color: "#c0392b" }}>
              â‚¹{minBid.toLocaleString()}
            </p>
          </div>

          <div>
            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: "700", color: "#a89880", textTransform: "uppercase" }}>
              Maximum Bid
            </p>
            <p style={{ margin: "0", fontSize: "20px", fontWeight: "800", color: "#2f855a" }}>
              â‚¹{maxBid.toLocaleString()}
            </p>
          </div>

          <div>
            <p style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: "700", color: "#a89880", textTransform: "uppercase" }}>
              Bid Range
            </p>
            <p style={{ margin: "0", fontSize: "20px", fontWeight: "800", color: "#4a3728" }}>
              â‚¹{(maxBid - minBid).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* â”€â”€ Status Breakdown â”€â”€ */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e0d4c0",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "28px"
      }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#4a3728" }}>ðŸ“ˆ Proposal Status Breakdown</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px"
        }}>
          {/* Accepted */}
          <div style={{
            background: "#d4f0e0",
            border: "1px solid #a8dfc0",
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#1a5c38", marginBottom: "6px" }}>
              âœ… {acceptedCount}
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#2d7659", textTransform: "uppercase" }}>
              Accepted
            </div>
            <div style={{ fontSize: "11px", color: "#7a6a55", marginTop: "4px" }}>
              {totalProposals > 0 ? ((acceptedCount / totalProposals) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Shortlisted */}
          <div style={{
            background: "#fdf3e3",
            border: "1px solid #e0d4c0",
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#6b4f3f", marginBottom: "6px" }}>
              â­ {shortlistedCount}
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#8a7a64", textTransform: "uppercase" }}>
              Shortlisted
            </div>
            <div style={{ fontSize: "11px", color: "#7a6a55", marginTop: "4px" }}>
              {totalProposals > 0 ? ((shortlistedCount / totalProposals) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Viewed */}
          <div style={{
            background: "#e8e4f8",
            border: "1px solid #d0c6e8",
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#3b2f7a", marginBottom: "6px" }}>
              ðŸ‘ï¸ {viewedCount}
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#5a4f8a", textTransform: "uppercase" }}>
              Viewed
            </div>
            <div style={{ fontSize: "11px", color: "#7a6a55", marginTop: "4px" }}>
              {totalProposals > 0 ? ((viewedCount / totalProposals) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Submitted */}
          <div style={{
            background: "#f0f0ff",
            border: "1px solid #d0c6e8",
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#4a4a8a", marginBottom: "6px" }}>
              ðŸ“ {submittedCount}
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#5a5a9a", textTransform: "uppercase" }}>
              Submitted
            </div>
            <div style={{ fontSize: "11px", color: "#7a6a55", marginTop: "4px" }}>
              {totalProposals > 0 ? ((submittedCount / totalProposals) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Rejected */}
          <div style={{
            background: "#f8d7da",
            border: "1px solid #f5c6c0",
            borderRadius: "10px",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", fontWeight: "800", color: "#721c24", marginBottom: "6px" }}>
              âŒ {rejectedCount}
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#8a4a52", textTransform: "uppercase" }}>
              Rejected
            </div>
            <div style={{ fontSize: "11px", color: "#7a6a55", marginTop: "4px" }}>
              {rejectionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Top Opportunities â”€â”€ */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e0d4c0",
        borderRadius: "12px",
        padding: "24px"
      }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#4a3728" }}>ðŸ’¡ Insights</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {acceptanceRate >= 30 && (
            <div style={{
              background: "#d4f0e0",
              border: "1px solid #a8dfc0",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#1a5c38",
              fontSize: "14px"
            }}>
              âœ… <strong>Great Success Rate!</strong> Your acceptance rate of {acceptanceRate}% is above average. Keep bidding on projects that match your skills!
            </div>
          )}

          {acceptanceRate < 10 && acceptanceRate > 0 && (
            <div style={{
              background: "#fff8f0",
              border: "1px solid #f0a500",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#7a5c1e",
              fontSize: "14px"
            }}>
              âš ï¸ <strong>Low Acceptance Rate:</strong> Only {acceptanceRate}% of your proposals are accepted. Try being more selective and personalizing your bids.
            </div>
          )}

          {shortlistedCount >= acceptedCount * 2 && acceptedCount > 0 && (
            <div style={{
              background: "#fdf3e3",
              border: "1px solid #e0d4c0",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#6b4f3f",
              fontSize: "14px"
            }}>
              â­ <strong>Popular with SMEs:</strong> You have {shortlistedCount} shortlisted proposals. This means SMEs are interested - focus on converting these to acceptances!
            </div>
          )}

          {totalProposals === 0 && (
            <div style={{
              background: "#e8e4f8",
              border: "1px solid #d0c6e8",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#3b2f7a",
              fontSize: "14px"
            }}>
              ðŸ“ <strong>Get Started:</strong> No proposals yet. <button
                onClick={() => navigate("/dashboard/browse-projects")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b2f7a",
                  textDecoration: "underline",
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                Browse projects
              </button> and submit your first proposal!
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ Action Buttons â”€â”€ */}
      <div style={{ marginTop: "28px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={() => navigate("/dashboard/browse-projects")}
          style={{
            padding: "12px 24px",
            background: "#b08968",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          ðŸ” Browse More Projects
        </button>
        <button
          onClick={() => navigate("/dashboard/my-proposals")}
          style={{
            padding: "12px 24px",
            background: "#f7f1e8",
            color: "#4a3728",
            border: "1px solid #e0d4c0",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          ðŸ“‹ View All Proposals
        </button>
      </div>
    </div>
  );
}
