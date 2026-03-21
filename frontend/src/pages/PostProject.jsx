import { useState } from "react";
import "./Project.css";
import "./PostProject.css";


export default function PostProject() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skills: "",
    experienceLevel: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
  });

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [estimating,  setEstimating]  = useState(false);
  const [estimation,  setEstimation]  = useState(null);
  const [estError,    setEstError]    = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear estimation if key fields change
    if (["title", "description", "skills", "experienceLevel"].includes(e.target.name)) {
      setEstimation(null);
    }
  };

  // ── AI Estimate ──────────────────────────────────────────
  const handleEstimate = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setEstError("Please fill in at least Title and Description before estimating.");
      return;
    }

    setEstimating(true);
    setEstError("");
    setEstimation(null);

    try {
      const res = await fetch("http://localhost:5000/api/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          title:           form.title,
          description:     form.description,
          skills:          form.skills,
          experienceLevel: form.experienceLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Estimation failed");

      setEstimation(data);
    } catch (err) {
      setEstError(err.message);
    } finally {
      setEstimating(false);
    }
  };

  // ── Apply estimate to form ───────────────────────────────
  const applyEstimate = () => {
    if (!estimation) return;
    const { budgetMin, budgetMax, timelineMax, recommendedExperienceLevel } = estimation.estimation;

    // Set deadline = today + timelineMax days
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + timelineMax);

    setForm((prev) => ({
      ...prev,
      budgetMin:       budgetMin.toString(),
      budgetMax:       budgetMax.toString(),
      deadline:        deadline.toISOString().split("T")[0],
      experienceLevel: recommendedExperienceLevel || prev.experienceLevel,
    }));
  };

  // ── Submit project ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()),
        }),
      });

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error("Server returned invalid response"); }

      if (!response.ok) throw new Error(data.message || "Failed to post project");

      setSuccess("✅ Project posted successfully!");
      setForm({ title: "", description: "", skills: "", experienceLevel: "", budgetMin: "", budgetMax: "", deadline: "" });
      setEstimation(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  const complexityColor = (score) => {
    if (score <= 3) return "#4a9b6f";
    if (score <= 6) return "#b08968";
    return "#c0392b";
  };

  const confidenceBadge = (level) => {
    const map = { High: "#4a9b6f", Medium: "#b08968", Low: "#c0392b" };
    return map[level] || "#a89880";
  };

  const canEstimate = form.title.trim().length > 2 && form.description.trim().length > 10;

  return (
    <div className="page-container">
      <h1>Post a Project</h1>

      <div className="pp-layout">

        {/* ── Left: Form ── */}
        <div className="pp-form-col">
          <form className="project-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Project Title *</label>
              <input
                name="title"
                placeholder="e.g. Build a React Dashboard"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                placeholder="Describe what you need in detail..."
                value={form.description}
                onChange={handleChange}
                rows={5}
                required
              />
            </div>

            <div className="form-group">
              <label>Required Skills</label>
              <input
                name="skills"
                placeholder="React, Node.js, MongoDB"
                value={form.skills}
                onChange={handleChange}
                required
              />
              <span className="pp-hint">Comma separated</span>
            </div>

            <div className="form-group">
              <label>Experience Level</label>
              <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} required>
                <option value="">Select level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Expert</option>
              </select>
            </div>

            {/* AI Estimate button */}
            <button
              type="button"
              className="pp-btn-estimate"
              onClick={handleEstimate}
              disabled={estimating || !canEstimate}
            >
              {estimating ? (
                <><span className="pp-spinner" /> Analyzing project...</>
              ) : (
                <>🤖 Get AI Estimate</>
              )}
            </button>

            {estError && <p className="error-msg">{estError}</p>}

            <div className="pp-divider" />

            <div className="pp-budget-row">
              <div className="form-group">
                <label>Min Budget (₹)</label>
                <input
                  name="budgetMin"
                  type="number"
                  placeholder="Min"
                  value={form.budgetMin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Budget (₹)</label>
                <input
                  name="budgetMax"
                  type="number"
                  placeholder="Max"
                  value={form.budgetMax}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                name="deadline"
                type="date"
                value={form.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="pp-btn-submit">
              {loading ? "Posting..." : "📤 Post Project"}
            </button>

            {error   && <p className="error-msg">{error}</p>}
            {success && <p className="pp-success">{success}</p>}
          </form>
        </div>

        {/* ── Right: AI Estimation Panel ── */}
        <div className="pp-estimate-col">
          {!estimation && !estimating && (
            <div className="pp-estimate-placeholder">
              <div className="pp-placeholder-icon">🤖</div>
              <h3>AI Project Estimator</h3>
              <p>Fill in your project title and description, then click <strong>"Get AI Estimate"</strong> to receive:</p>
              <ul>
                <li>💰 Recommended budget range</li>
                <li>📅 Expected timeline</li>
                <li>👤 Freelancer skill level</li>
                <li>⚠️ Risk warnings</li>
              </ul>
              <p className="pp-placeholder-note">Powered by Groq (Llama 3) + real platform data</p>
            </div>
          )}

          {estimating && (
            <div className="pp-estimate-loading">
              <div className="pp-loading-spinner" />
              <p>Analyzing your project...</p>
              <p className="pp-loading-sub">Checking similar projects and market rates</p>
            </div>
          )}

          {estimation && !estimating && (
            <div className="pp-estimate-result">
              <div className="pp-result-header">
                <h3>🤖 AI Estimation</h3>
                <div className="pp-result-badges">
                  <span
                    className="pp-badge"
                    style={{ background: confidenceBadge(estimation.estimation.confidenceLevel) }}
                  >
                    {estimation.estimation.confidenceLevel} Confidence
                  </span>
                  <span className="pp-badge pp-badge-neutral">
                    Complexity {estimation.estimation.complexityScore}/10
                  </span>
                </div>
              </div>

              {/* Budget */}
              <div className="pp-result-card">
                <p className="pp-result-label">💰 Recommended Budget</p>
                <p className="pp-result-main">
                  ₹{estimation.estimation.budgetMin?.toLocaleString()}
                  <span> – </span>
                  ₹{estimation.estimation.budgetMax?.toLocaleString()}
                </p>
                {estimation.meta.avgMarketRate && (
                  <p className="pp-result-sub">
                    Platform avg: ₹{estimation.meta.avgMarketRate.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="pp-result-card">
                <p className="pp-result-label">📅 Expected Timeline</p>
                <p className="pp-result-main">
                  {estimation.estimation.timelineMin} – {estimation.estimation.timelineMax} days
                </p>
              </div>

              {/* Experience */}
              <div className="pp-result-card">
                <p className="pp-result-label">👤 Recommended Freelancer Level</p>
                <p className="pp-result-main">{estimation.estimation.recommendedExperienceLevel}</p>
              </div>

              {/* Complexity bar */}
              <div className="pp-result-card">
                <p className="pp-result-label">⚙️ Complexity</p>
                <div className="pp-complexity-bar-bg">
                  <div
                    className="pp-complexity-bar"
                    style={{
                      width: `${estimation.estimation.complexityScore * 10}%`,
                      background: complexityColor(estimation.estimation.complexityScore),
                    }}
                  />
                </div>
                <p className="pp-result-sub">{estimation.estimation.complexityScore} / 10</p>
              </div>

              {/* Risk warnings */}
              {estimation.estimation.riskWarnings?.length > 0 && (
                <div className="pp-risk-box">
                  <p className="pp-risk-title">⚠️ Risk Warnings</p>
                  {estimation.estimation.riskWarnings.map((w, i) => (
                    <p key={i} className="pp-risk-item">• {w}</p>
                  ))}
                </div>
              )}

              {/* Reasoning */}
              {estimation.estimation.reasoning && (
                <div className="pp-reasoning">
                  <p className="pp-result-label">💡 AI Reasoning</p>
                  <p className="pp-reasoning-text">{estimation.estimation.reasoning}</p>
                </div>
              )}

              {/* Suggested skills */}
              {estimation.estimation.suggestedSkills?.length > 0 && (
                <div className="pp-result-card">
                  <p className="pp-result-label">🛠 Suggested Skills</p>
                  <div className="pp-skills-list">
                    {estimation.estimation.suggestedSkills.map((s, i) => (
                      <span key={i} className="pp-skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              {estimation.meta.similarProjectsFound > 0 && (
                <p className="pp-meta">
                  Based on {estimation.meta.similarProjectsFound} similar project{estimation.meta.similarProjectsFound > 1 ? "s" : ""} and {estimation.meta.marketDataPoints} market data points
                </p>
              )}

              {/* Apply button */}
              <button className="pp-btn-apply" onClick={applyEstimate}>
                ✅ Apply Estimate to Form
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

