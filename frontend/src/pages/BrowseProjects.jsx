import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RatingDisplay from "../components/RatingDisplay";
import "./Project.css";

export default function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [matchedProjects, setMatchedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchedLoading, setMatchedLoading] = useState(false);
  const [counts, setCounts] = useState({});
  const [skill, setSkill] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [expLevel, setExpLevel] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("");
  const [view, setView] = useState("all"); // "all" or "recommended"
  const [selectedSme, setSelectedSme] = useState(null);
  const [showSmeProfileModal, setShowSmeProfileModal] = useState(false);
  const [smeLoading, setSmeLoading] = useState(false);
  const [smeError, setSmeError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("accessToken");

  const fetchSmeProfile = async (smeId) => {
    setSmeLoading(true);
    setSmeError("");
    try {
      const res = await fetch(`http://localhost:5000/api/auth/profile/${smeId}`);
      const data = await res.json();

      if (!res.ok) {
        setSmeError(data.message || "Failed to load profile");
        return;
      }

      setSelectedSme(data.user || data);
      setShowSmeProfileModal(true);
    } catch (err) {
      setSmeError(err.message || "Network error");
    } finally {
      setSmeLoading(false);
    }
  };

  const fetchMatchedProjects = async () => {
    setMatchedLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/matchmaking/freelancer/matching-projects?limit=50&minScore=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch matched projects");

      const data = await res.json();
      setMatchedProjects(data.matches || []);
    } catch (err) {
      console.error("Error fetching matched projects:", err);
      setMatchedProjects([]);
    } finally {
      setMatchedLoading(false);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skill) params.append("skill", skill);
      if (minBudget) params.append("minBudget", minBudget);
      if (maxBudget) params.append("maxBudget", maxBudget);
      if (expLevel) params.append("experienceLevel", expLevel);
      if (deadlineDays) params.append("deadlineDays", deadlineDays);

      const res = await fetch(`http://localhost:5000/api/projects?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setProjects(data);

      const countMap = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const r = await fetch(
              `http://localhost:5000/api/proposals/project/${p._id}/count`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const d = await r.json();
            countMap[p._id] = d.count || 0;
          } catch {
            countMap[p._id] = 0;
          }
        })
      );
      setCounts(countMap);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchMatchedProjects();
    }
  }, [token, location.key]);

  const clearFilters = () => {
    setSkill("");
    setMinBudget("");
    setMaxBudget("");
    setExpLevel("");
    setDeadlineDays("");
  };

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return "#2d7a52"; // Green
    if (score >= 60) return "#b08968"; // Brown
    if (score >= 40) return "#f39c12"; // Orange
    return "#e74c3c"; // Red
  };

  const hasFilters =
    skill || minBudget || maxBudget || expLevel || deadlineDays;

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Browse Projects</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setView("all")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              background: view === "all" ? "#b08968" : "#e8dcc8",
              color: view === "all" ? "white" : "#333",
              transition: "all 0.2s ease"
            }}
          >
            All Projects
          </button>
          <button
            onClick={() => setView("recommended")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              background: view === "recommended" ? "#b08968" : "#e8dcc8",
              color: view === "recommended" ? "white" : "#333",
              transition: "all 0.2s ease"
            }}
          >
            Recommended For You
          </button>
        </div>
      </div>

      {/* Filters - Only show for "All Projects" view */}
      {view === "all" && (
        <div className="filters">
          <input
            type="text"
            placeholder="Search by skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
          <input
            type="number"
            placeholder="Min Budget (₹)"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Budget (₹)"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
          <select value={expLevel} onChange={(e) => setExpLevel(e.target.value)}>
            <option value="">All Experience Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input
            type="number"
            placeholder="Days until deadline"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
          />
          <button onClick={fetchProjects}>Search</button>
          {hasFilters && <button onClick={clearFilters}>Clear Filters</button>}
        </div>
      )}

      {/* Projects */}
      <div>
        {view === "all" && loading && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", color: "#7a6a55", fontWeight: "500" }}>
              Loading projects...
            </div>
          </div>
        )}

        {view === "recommended" && matchedLoading && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", color: "#7a6a55", fontWeight: "500" }}>
              Finding your best matches...
            </div>
          </div>
        )}

        {view === "all" && !loading && projects.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", color: "#7a6a55" }}>
              No projects found. Try adjusting your filters.
            </div>
          </div>
        )}

        {view === "recommended" && !matchedLoading && matchedProjects.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", color: "#7a6a55" }}>
              No matching projects found yet. Keep updating your skills and profile!
            </div>
          </div>
        )}

        {view === "all" && !loading && projects.length > 0 && (
          <div className="projects">
            {projects.map((p) => {
              const days = daysLeft(p.deadline);
              const isExpired = days !== null && days < 0;

              return (
                <div className="project-card" key={p._id}>
                  <h3>{p.title}</h3>
                  <p style={{ color: "#a89880", fontSize: "13px", margin: "4px 0 12px 0" }}>
                    {p.description}
                  </p>

                  <div style={{
                    background: "#f7f1e8",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    margin: "8px 0"
                  }}>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Budget:</strong> <span style={{ color: "#b08968", fontWeight: "700" }}>₹{p.budgetMin?.toLocaleString()} - ₹{p.budgetMax?.toLocaleString()}</span>
                    </p>
                    {days !== null && (
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>
                        <strong>⏰ Deadline:</strong> <span style={{ color: isExpired ? "#c0392b" : "#1a5c38" }}>{isExpired ? "Expired" : days + " days left"}</span>
                      </p>
                    )}
                  </div>

                  <div style={{ margin: "12px 0", paddingBottom: "12px", borderBottom: "1px solid #ede5d9" }}>
                    <p style={{ margin: "4px 0 8px 0", fontSize: "13px" }}>
                      <strong style={{ color: "#4a3728" }}>Required Skills:</strong>
                    </p>
                    {p.skills && p.skills.length > 0 ? (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {p.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#e8dfd0",
                              color: "#4a3728",
                              padding: "4px 12px",
                              borderRadius: "16px",
                              fontSize: "12px",
                              fontWeight: "600",
                              border: "1px solid #d4c4b0"
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#a89880" }}>No specific skills required</span>
                    )}
                  </div>

                  <div style={{ margin: "12px 0", paddingBottom: "12px" }}>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <strong style={{ color: "#4a3728" }}>Experience Level:</strong>
                      <span style={{
                        marginLeft: "8px",
                        background: "#fff3e0",
                        color: "#6b4f3f",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "1px solid #f0e0b0"
                      }}>
                        {p.experienceLevel || "Not specified"}
                      </span>
                    </p>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid #ede5d9"
                  }}>
                    <div style={{ fontSize: "13px", color: "#7a6a55" }}>
                      <span style={{ display: "block", marginBottom: "4px" }}><strong style={{ color: "#4a3728" }}>Posted by:</strong></span>
                      <span style={{ fontWeight: "600", color: "#4a3728" }}>{p.postedBy?.fullName || "SME"}</span>
                    </div>
                    <button
                      onClick={() =>
                        p.postedBy?._id && fetchSmeProfile(p.postedBy._id)
                      }
                      className="view-profile-btn"
                      style={{
                        padding: "9px 14px",
                        background: "transparent",
                        border: "2px solid #b08968",
                        color: "#b08968",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "12px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = "#b08968";
                        e.target.style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.color = "#b08968";
                      }}
                    >
                      View
                    </button>
                  </div>

                  {!isExpired && (
                    <button
                      onClick={() => navigate(`/dashboard/apply/${p._id}`)}
                      style={{
                        width: "100%",
                        marginTop: "14px",
                        padding: "12px 16px",
                        background: "linear-gradient(135deg, #b08968 0%, #9d7559 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 16px rgba(176, 137, 104, 0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 12px rgba(176, 137, 104, 0.25)";
                      }}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === "recommended" && !matchedLoading && matchedProjects.length > 0 && (
          <div className="projects">
            {matchedProjects.map((project, idx) => {
              const days = daysLeft(project.deadline);
              const isExpired = days !== null && days < 0;

              return (
                <div className="project-card" key={project.id} style={{ borderLeft: "4px solid #b08968" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0 }}>{project.title}</h3>
                    <div style={{
                      background: getMatchScoreColor(project.overallMatch),
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "14px"
                    }}>
                      {project.overallMatch}%
                    </div>
                  </div>

                  <p style={{ color: "#a89880", fontSize: "13px", margin: "4px 0 12px 0" }}>
                    {project.description?.substring(0, 100)}...
                  </p>

                  {project.hasExistingProposal && (
                    <div style={{
                      background: "#e8f5e9",
                      border: "1px solid #2d7a52",
                      borderLeft: "4px solid #2d7a52",
                      padding: "12px",
                      borderRadius: "4px",
                      marginBottom: "12px"
                    }}>
                      <span style={{
                        display: "inline-block",
                        background: "#2d7a52",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        ✓ Already Applied
                      </span>
                      {project.proposalStatus && (
                        <div style={{ marginTop: "6px", fontSize: "12px", color: "#2d7a52" }}>
                          Status: <strong>{project.proposalStatus}</strong>
                          {project.proposalBid && <span> • Bid: ₹{project.proposalBid}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{
                    background: "#f7f1e8",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    margin: "8px 0"
                  }}>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Budget:</strong> {project.budgetRange}
                    </p>
                    {days !== null && (
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>
                        <strong>Deadline:</strong> <span style={{ color: isExpired ? "#c0392b" : "#1a5c38" }}>{isExpired ? "Expired" : days + " days left"}</span>
                      </p>
                    )}
                  </div>

                  <div style={{ margin: "12px 0", paddingBottom: "12px", borderBottom: "1px solid #ede5d9" }}>
                    <p style={{ margin: "4px 0 8px 0", fontSize: "13px" }}>
                      <strong style={{ color: "#4a3728" }}>Required Skills:</strong>
                    </p>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {project.skills?.slice(0, 5).map((skill, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#b08968",
                            color: "white",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            fontSize: "11px",
                            fontWeight: "600"
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/dashboard/project/${project.id}`)}
                    disabled={project.hasExistingProposal}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: project.hasExistingProposal ? "#d9d9d9" : "linear-gradient(135deg, #b08968 0%, #9d7559 100%)",
                      color: project.hasExistingProposal ? "#999" : "white",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: project.hasExistingProposal ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: project.hasExistingProposal ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!project.hasExistingProposal) {
                        e.target.style.boxShadow = "0 4px 12px rgba(176, 137, 104, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.boxShadow = "none";
                    }}
                    title={project.hasExistingProposal ? "You have already applied to this project" : "View project details"}
                  >
                    {project.hasExistingProposal ? "✓ Already Applied" : "View Project"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal FIXED */}
      {(showSmeProfileModal || smeLoading) && (
        <div className="modal-overlay" onClick={() => setShowSmeProfileModal(false)}>
          {smeLoading ? (
            <div className="modal">Loading...</div>
          ) : smeError ? (
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <p style={{ color: "#c0392b" }}>{smeError}</p>
              <button onClick={() => setShowSmeProfileModal(false)}>
                Close
              </button>
            </div>
          ) : selectedSme ? (
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{selectedSme.fullName}</h2>
              <p><strong>Email:</strong> {selectedSme.email}</p>
              <RatingDisplay userId={selectedSme._id} />
              {selectedSme.bio && (
                <div style={{background: "#f7f1e8", padding: "12px", borderRadius: "6px", marginBottom: "12px"}}>
                  <strong>Bio:</strong> {selectedSme.bio}
                </div>
              )}
              {selectedSme.companyName && <p><strong>Company:</strong> {selectedSme.companyName}</p>}
              {selectedSme.industryType && <p><strong>Industry:</strong> {selectedSme.industryType}</p>}
              {selectedSme.website && <p><strong>Website:</strong> <a href={selectedSme.website} target="_blank" rel="noopener noreferrer" style={{color: "#b08968"}}>{selectedSme.website}</a></p>}

              <button onClick={() => setShowSmeProfileModal(false)}>
                Close
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}