import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./MatchedFreelancers.css";

export default function MatchedFreelancers() {
  const { projectId } = useParams();
  const [matches, setMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [project, setProject] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMatchedFreelancers = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `http://localhost:5000/api/matchmaking/project/${projectId}/matching-freelancers?limit=15`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch matched freelancers");

        const data = await res.json();
        setProject(data.project);
        setMatches(data.matches);
        setStatistics(data.statistics);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedFreelancers();
  }, [projectId]);

  // Filter matches based on search query
  useEffect(() => {
    const filtered = matches.filter(m => {
      const searchLower = searchQuery.toLowerCase();
      return (
        m.name?.toLowerCase().includes(searchLower) ||
        m.skills?.some(skill => skill.toLowerCase().includes(searchLower))
      );
    });
    setFilteredMatches(filtered);
  }, [searchQuery, matches]);

  const getMatchScoreColor = (score) => {
    if (score >= 80) return "#2d7a52"; // Green
    if (score >= 60) return "#b08968"; // Brown
    if (score >= 40) return "#f39c12"; // Orange
    return "#e74c3c"; // Red
  };

  const getMetricStyle = (score) => ({
    background: getMatchScoreColor(score),
    color: "white",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
    marginRight: "8px",
    marginBottom: "8px",
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading matched freelancers...</div>
      </div>
    );
  }

  return (
    <div className="page-container mf-container">
      <h1>🎯 Matched Freelancers</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Project Summary */}
      {project && (
        <div className="mf-project-summary">
          <h2>{project.title}</h2>
          <div className="mf-project-details">
            <span>💰 {project.budgetRange} NPR</span>
            <span>👤 Level: {project.experienceLevel}</span>
            <span>📅 Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
          </div>
          <div className="mf-skills">
            {project.skills.map((skill, idx) => (
              <span key={idx} className="mf-skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{
        marginBottom: "20px",
        display: "flex",
        gap: "10px"
      }}>
        <input
          type="text"
          placeholder="🔍 Search by name or skill..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #d4af8c",
            fontSize: "14px",
            fontFamily: "inherit"
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              padding: "12px 16px",
              background: "#e8dcc8",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#333"
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="mf-statistics">
          <div className="mf-stat">
            <div className="mf-stat-value">{statistics.matchesFound}</div>
            <div className="mf-stat-label">Qualified Matches</div>
          </div>
          <div className="mf-stat">
            <div className="mf-stat-value">{statistics.totalFreelancersInPool}</div>
            <div className="mf-stat-label">Total Freelancers</div>
          </div>
          <div className="mf-stat">
            <div className="mf-stat-value">{statistics.averageMatchScore}%</div>
            <div className="mf-stat-label">Avg Match Score</div>
          </div>
          <div className="mf-stat">
            <div className="mf-stat-value">{statistics.topMatch}%</div>
            <div className="mf-stat-label">Top Match</div>
          </div>
        </div>
      )}

      {/* Matches List */}
      {!loading && matches.length === 0 ? (
        <div className="mf-no-results">
          <p>No matching freelancers found. Try adjusting your requirements.</p>
        </div>
      ) : !loading && filteredMatches.length === 0 ? (
        <div className="mf-no-results">
          <p>No freelancers match your search. Try different keywords.</p>
        </div>
      ) : (
        <div className="mf-matches">
          {filteredMatches.map((match, idx) => (
            <div key={match.id} className="mf-freelancer-card">
              <div className="mf-card-header">
                <div className="mf-rank-badge">#{idx + 1}</div>
                <div className="mf-freelancer-info">
                  <h3>{match.name}</h3>
                  <p className="mf-title">{match.title}</p>
                </div>
                <div
                  className="mf-overall-score"
                  style={{ background: getMatchScoreColor(match.overallMatch) }}
                >
                  <div className="mf-score-value">{match.overallMatch}%</div>
                  <div className="mf-score-label">Match</div>
                </div>
              </div>

              <div className="mf-card-body">
                {/* Ratings */}
                <div className="mf-ratings">
                  <span className="mf-rating">
                    ⭐ {match.averageRating?.toFixed(1) || "N/A"} ({match.totalReviews} reviews)
                  </span>
                  {match.portfolioCount > 0 && (
                    <span className="mf-portfolio">
                      📂 {match.portfolioCount} portfolio item{match.portfolioCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {match.bio && <p className="mf-bio">{match.bio}</p>}

                {/* Skills */}
                <div className="mf-skills-list">
                  <strong>Skills:</strong>
                  <div className="mf-skill-tags">
                    {match.skills.slice(0, 5).map((skill, i) => (
                      <span key={i} className="mf-skill-tag">{skill}</span>
                    ))}
                    {match.skills.length > 5 && (
                      <span className="mf-skill-tag mf-more">+{match.skills.length - 5}</span>
                    )}
                  </div>
                </div>

                {/* Rates */}
                <div className="mf-rates">
                  {match.hourlyRate && (
                    <span>💵 ₹{match.hourlyRate}/hour</span>
                  )}
                  {match.projectRate && (
                    <span>💰 ₹{match.projectRate} base rate</span>
                  )}
                  {match.weeklyAvailability && (
                    <span>⏰ {match.weeklyAvailability} hours/week</span>
                  )}
                </div>

                {/* Match Metrics */}
                <div
                  className="mf-metrics-toggle"
                  onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
                >
                  <span>📊 Match Breakdown</span>
                  <span className="mf-toggle-icon">{expandedId === match.id ? "▼" : "▶"}</span>
                </div>

                {expandedId === match.id && (
                  <div className="mf-metrics">
                    <div className="mf-metric-item">
                      <span className="mf-metric-name">Skill Match</span>
                      <div style={getMetricStyle(match.matchMetrics.skillMatch)}>
                        {match.matchMetrics.skillMatch}%
                      </div>
                    </div>
                    <div className="mf-metric-item">
                      <span className="mf-metric-name">Experience Level</span>
                      <div style={getMetricStyle(match.matchMetrics.experienceLevel)}>
                        {match.matchMetrics.experienceLevel}%
                      </div>
                    </div>
                    <div className="mf-metric-item">
                      <span className="mf-metric-name">Quality (Ratings)</span>
                      <div style={getMetricStyle(match.matchMetrics.rating)}>
                        {match.matchMetrics.rating}%
                      </div>
                    </div>
                    <div className="mf-metric-item">
                      <span className="mf-metric-name">Budget Fit</span>
                      <div style={getMetricStyle(match.matchMetrics.budget)}>
                        {match.matchMetrics.budget}%
                      </div>
                    </div>
                    <div className="mf-metric-item">
                      <span className="mf-metric-name">Availability</span>
                      <div style={getMetricStyle(match.matchMetrics.availability)}>
                        {match.matchMetrics.availability}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mf-card-footer">
                <button className="mf-btn-invite">
                  💌 Invite to Project
                </button>
                <button className="mf-btn-view">
                  👤 View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
