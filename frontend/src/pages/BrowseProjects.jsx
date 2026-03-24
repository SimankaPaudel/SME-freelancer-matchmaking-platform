import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Project.css";

export default function BrowseProjects() {
  const [projects,    setProjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [counts,      setCounts]      = useState({});
  const [skill,       setSkill]       = useState("");
  const [minBudget,   setMinBudget]   = useState("");
  const [maxBudget,   setMaxBudget]   = useState("");
  const [expLevel,    setExpLevel]    = useState("");
  const [deadlineDays,setDeadlineDays]= useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const token    = localStorage.getItem("accessToken");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skill)        params.append("skill",           skill);
      if (minBudget)    params.append("minBudget",       minBudget);
      if (maxBudget)    params.append("maxBudget",       maxBudget);
      if (expLevel)     params.append("experienceLevel", expLevel);
      if (deadlineDays) params.append("deadlineDays",    deadlineDays);

      const res  = await fetch(`http://localhost:5000/api/projects?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data);

      // Fetch applicant counts
      const countMap = {};
      await Promise.all(data.map(async (p) => {
        try {
          const r = await fetch(`http://localhost:5000/api/proposals/project/${p._id}/count`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) { const d = await r.json(); countMap[p._id] = d.count || 0; }
        } catch { countMap[p._id] = 0; }
      }));
      setCounts(countMap);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [location.key]);

  const clearFilters = () => {
    setSkill(""); setMinBudget(""); setMaxBudget("");
    setExpLevel(""); setDeadlineDays("");
  };

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const hasFilters = skill || minBudget || maxBudget || expLevel || deadlineDays;

  return (
    <div className="page-container">
      <h1>Browse Projects</h1>

      <div className="browse-layout">
        {/* ── Filters ── */}
        <div className="filters">
          <h4>Filters</h4>

          <label className="filter-label">Skill</label>
          <input type="text" placeholder="e.g. React, Design" value={skill} onChange={(e) => setSkill(e.target.value)} />

          <label className="filter-label">Experience Level</label>
          <select value={expLevel} onChange={(e) => setExpLevel(e.target.value)}>
            <option value="">Any Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Expert">Expert</option>
          </select>

          <label className="filter-label">Min Budget (₹)</label>
          <input type="number" placeholder="e.g. 5000" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />

          <label className="filter-label">Max Budget (₹)</label>
          <input type="number" placeholder="e.g. 50000" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />

          <label className="filter-label">Deadline Within</label>
          <select value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)}>
            <option value="">Any Time</option>
            <option value="7">Next 7 days</option>
            <option value="14">Next 14 days</option>
            <option value="30">Next 30 days</option>
            <option value="60">Next 60 days</option>
          </select>

          <button onClick={fetchProjects}>🔍 Apply Filters</button>
          {hasFilters && (
            <button onClick={clearFilters} style={{ background: "transparent", color: "#b08968", border: "1px solid #b08968", marginTop: 6 }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* ── Projects ── */}
        <div className="projects">
          {loading && <p style={{ color: "#a89880", padding: "20px 0" }}>Loading projects...</p>}

          {!loading && projects.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#a89880" }}>
              <p>No projects found matching your filters.</p>
              {hasFilters && <button className="bp-apply-btn" onClick={clearFilters} style={{ marginTop: 12 }}>Clear Filters</button>}
            </div>
          )}

          {!loading && projects.map((p) => {
            const days      = daysLeft(p.deadline);
            const isUrgent  = days !== null && days <= 7 && days >= 0;
            const isExpired = days !== null && days < 0;
            const count     = counts[p._id] ?? "—";

            return (
              <div className="project-card" key={p._id}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <h3 style={{ margin: 0 }}>{p.title}</h3>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isUrgent  && <span className="bp-urgent-badge">🔥 {days}d left</span>}
                    {isExpired && <span className="bp-expired-badge">Expired</span>}
                  </div>
                </div>

                <p style={{ color: "#7a6a55", fontSize: 14, margin: "8px 0", lineHeight: 1.6 }}>
                  {p.description?.length > 160 ? p.description.slice(0, 160) + "..." : p.description}
                </p>

                <div className="bp-info-grid">
                  <div className="bp-info-row">
                    <span className="bp-info-label">💰 Budget</span>
                    <span className="bp-info-value">₹{p.budgetMin?.toLocaleString()} – ₹{p.budgetMax?.toLocaleString()}</span>
                  </div>
                  {p.experienceLevel && (
                    <div className="bp-info-row">
                      <span className="bp-info-label">👤 Level</span>
                      <span className="bp-info-value">{p.experienceLevel}</span>
                    </div>
                  )}
                  {p.deadline && (
                    <div className="bp-info-row">
                      <span className="bp-info-label">📅 Deadline</span>
                      <span className="bp-info-value" style={{ color: isUrgent ? "#c0392b" : undefined }}>
                        {new Date(p.deadline).toLocaleDateString()}
                        {days !== null && !isExpired && (
                          <span style={{ color: "#a89880", marginLeft: 6, fontSize: 12 }}>({days}d left)</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="bp-info-row">
                    <span className="bp-info-label">🏢 Posted by</span>
                    <span className="bp-info-value">{p.postedBy?.fullName || "SME"}</span>
                  </div>
                  <div className="bp-info-row">
                    <span className="bp-info-label">👥 Applicants</span>
                    <span className="bp-info-value"><strong>{count}</strong></span>
                  </div>
                </div>

                {p.skills?.length > 0 && (
                  <div className="tags" style={{ marginTop: 10 }}>
                    {p.skills.map((s, i) => <span key={i}>{s}</span>)}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 10 }}>
                  <span className={`status ${p.status?.toLowerCase() || "open"}`}>{p.status || "Open"}</span>
                  {p.status === "Open" && !isExpired && (
                    <button className="bp-apply-btn" onClick={() => navigate(`/dashboard/apply/${p._id}`)}>
                      Apply Now →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
