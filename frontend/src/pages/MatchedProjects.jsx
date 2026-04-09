import { useState, useEffect } from "react";
import "./MatchedProjects.css";

export default function MatchedProjects() {
  const [matches, setMatches] = useState([]);
  const [freelancer, setFreelancer] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchMatchedProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/matchmaking/freelancer/matching-projects?limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Server error: ${res.statusText} (${res.status})`);
        }

        const data = await res.json();
        setFreelancer(data.freelancer);
        setMatches(data.matches);
        setStatistics(data.statistics);
      } catch (err) {
        console.error("Matchmaking fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchedProjects();
  }, []);

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
        <div className="mp-loading-spinner">
          <div className="mp-spinner"></div>
          Loading recommended projects...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container mp-container">
      <h1>Recommended Projects for You</h1>

      {error && <div className="mp-error-message">{error}</div>}

      {/* Freelancer Profile Summary */}
      {freelancer && (
        <div className="mp-freelancer-summary">
          <div className="mp-summary-left">
            <h3>Your Profile Skills</h3>
            <div className="mp-skills">
              {freelancer.skills.slice(0, 6).map((skill, idx) => (
                <span key={idx} className="mp-skill-tag">{skill}</span>
              ))}
              {freelancer.skills.length > 6 && (
                <span className="mp-skill-tag mp-more">+{freelancer.skills.length - 6}</span>
              )}
            </div>
          </div>
          <div className="mp-summary-right">
            <div className="mp-info">
              <span>💵 Hourly Rate: ₹{freelancer.hourlyRate || "Not Set"}</span>
              <span>⭐ Your Rating: {freelancer.averageRating?.toFixed(1) || "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {statistics && (
        <div className="mp-statistics">
          <div className="mp-stat">
            <div className="mp-stat-value">{statistics.matchesFound}</div>
            <div className="mp-stat-label">Matching Projects</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-value">{statistics.totalProjectsAvailable}</div>
            <div className="mp-stat-label">Total Projects</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-value">{statistics.averageMatchScore}%</div>
            <div className="mp-stat-label">Avg Match Score</div>
          </div>
          <div className="mp-stat">
            <div className="mp-stat-value">{statistics.topMatch}%</div>
            <div className="mp-stat-label">Best Match</div>
          </div>
        </div>
      )}

      {/* Projects List */}
      {matches.length === 0 ? (
        <div className="mp-no-results">
          <p>No matching projects found yet. Keep updating your skills and profile!</p>
        </div>
      ) : (
        <div className="mp-projects">
          {matches.map((match, idx) => (
            <div key={match.id} className="mp-project-card">
              <div className="mp-card-header">
                <div className="mp-rank-badge">#{idx + 1}</div>
                <div className="mp-project-info">
                  <h3>{match.title}</h3>
                  <p className="mp-company">Posted by: {match.postedBy}</p>
                </div>
                <div
                  className="mp-overall-score"
                  style={{ background: getMatchScoreColor(match.overallMatch) }}
                >
                  <div className="mp-score-value">{match.overallMatch}%</div>
                  <div className="mp-score-label">Match</div>
                </div>
              </div>

              <div className="mp-card-body">
                {/* Project Meta */}
                <div className="mp-project-meta">
                  <span className="mp-meta-item">
                    💰 {match.budgetRange}
                  </span>
                  <span className="mp-meta-item">
                    👤 Level: {match.experienceLevel}
                  </span>
                  <span className="mp-meta-item">
                    📅 {new Date(match.deadline).toLocaleDateString()}
                  </span>
                </div>

                {/* Required Skills */}
                <div className="mp-skills-section">
                  <strong>Required Skills:</strong>
                  <div className="mp-skill-tags">
                    {match.skills.map((skill, i) => (
                      <span key={i} className="mp-skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                {/* Match Metrics Toggle */}
                <div
                  className="mp-metrics-toggle"
                  onClick={() => setExpandedId(expandedId === match.id ? null : match.id)}
                >
                  <span>📊 Match Breakdown</span>
                  <span className="mp-toggle-icon">{expandedId === match.id ? "▼" : "▶"}</span>
                </div>

                {expandedId === match.id && (
                  <div className="mp-metrics">
                    <div className="mp-metric-item">
                      <span className="mp-metric-name">Skill Match</span>
                      <div style={getMetricStyle(match.matchMetrics.skillMatch)}>
                        {match.matchMetrics.skillMatch}%
                      </div>
                    </div>
                    <div className="mp-metric-item">
                      <span className="mp-metric-name">Experience Level</span>
                      <div style={getMetricStyle(match.matchMetrics.experienceLevel)}>
                        {match.matchMetrics.experienceLevel}%
                      </div>
                    </div>
                    <div className="mp-metric-item">
                      <span className="mp-metric-name">Quality (Rating)</span>
                      <div style={getMetricStyle(match.matchMetrics.rating)}>
                        {match.matchMetrics.rating}%
                      </div>
                    </div>
                    <div className="mp-metric-item">
                      <span className="mp-metric-name">Budget Fit</span>
                      <div style={getMetricStyle(match.matchMetrics.budget)}>
                        {match.matchMetrics.budget}%
                      </div>
                    </div>
                    <div className="mp-metric-item">
                      <span className="mp-metric-name">Your Availability</span>
                      <div style={getMetricStyle(match.matchMetrics.availability)}>
                        {match.matchMetrics.availability}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mp-card-footer">
                <button className="mp-btn-apply">
                  ✨ View & Apply
                </button>
                <button className="mp-btn-details">
                  📖 View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
