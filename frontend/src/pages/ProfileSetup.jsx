import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSetup.css";

const INDUSTRY_OPTIONS = [
  "Technology", "Healthcare", "Education", "Finance", "E-commerce",
  "Manufacturing", "Construction", "Agriculture", "Tourism", "Media & Entertainment",
  "Retail", "Logistics", "Real Estate", "NGO / Non-profit", "Other",
];

const TEAM_SIZES = ["1-5", "6-20", "21-50", "51-200", "200+"];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("accessToken");
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const role     = user.role;

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Freelancer fields
  const [bio,              setBio]              = useState("");
  const [skills,           setSkills]           = useState("");
  const [hourlyRate,       setHourlyRate]       = useState("");
  const [projectRate,      setProjectRate]      = useState("");
  const [weeklyAvail,      setWeeklyAvail]      = useState("");
  const [linkedin,         setLinkedin]         = useState("");
  const [github,           setGithub]           = useState("");
  const [website,          setWebsite]          = useState("");

  // SME fields
  const [companyName,      setCompanyName]      = useState("");
  const [industryType,     setIndustryType]     = useState("");
  const [teamSize,         setTeamSize]         = useState("");
  const [preferredTech,    setPreferredTech]    = useState("");
  const [budgetMin,        setBudgetMin]        = useState("");
  const [budgetMax,        setBudgetMax]        = useState("");
  const [smeWebsite,       setSmeWebsite]       = useState("");
  const [description,      setDescription]      = useState("");

  const totalSteps = 2;

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    let body = {};

    if (role === "Freelancer") {
      if (!skills.trim()) { setError("Please add at least one skill."); setLoading(false); return; }
      body = {
        bio,
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
        hourlyRate:         hourlyRate  ? Number(hourlyRate)  : undefined,
        projectRate:        projectRate ? Number(projectRate) : undefined,
        weeklyAvailability: weeklyAvail ? Number(weeklyAvail) : undefined,
        socialLinks: { linkedin, github, website },
      };
    } else {
      if (!companyName.trim()) { setError("Company name is required."); setLoading(false); return; }
      body = {
        companyName,
        industryType,
        teamSize,
        preferredTechnologies: preferredTech.split(",").map(s => s.trim()).filter(Boolean),
        budgetRange: { min: Number(budgetMin), max: Number(budgetMax) },
        website: smeWebsite,
        description,
      };
    }

    try {
      const res  = await fetch("http://localhost:5000/api/auth/profile/setup", {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");

      // Update local storage
      const updatedUser = { ...user, isProfileComplete: true };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ps-page">
      <div className="ps-card">
        {/* Header */}
        <div className="ps-header">
          <div className="ps-logo">🐝 TaskHive</div>
          <h2>Complete Your Profile</h2>
          <p>Help {role === "Freelancer" ? "clients" : "freelancers"} know more about you</p>
        </div>

        {/* Progress */}
        <div className="ps-progress">
          <div className="ps-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
        <p className="ps-step-label">Step {step} of {totalSteps}</p>

        {error && <div className="ps-error">{error}</div>}

        {/* ── FREELANCER STEPS ── */}
        {role === "Freelancer" && (
          <>
            {step === 1 && (
              <div className="ps-step">
                <h3>Your Skills & Bio</h3>

                <div className="ps-field">
                  <label>Bio <span className="ps-optional">(optional)</span></label>
                  <textarea
                    placeholder="Tell clients about yourself, your experience, and what makes you stand out..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <span className="ps-char-count">{bio.length}/500</span>
                </div>

                <div className="ps-field">
                  <label>Skills <span className="ps-required">*</span></label>
                  <input
                    placeholder="React, Node.js, Figma, Python..."
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                  />
                  <span className="ps-hint">Comma separated</span>
                  {skills && (
                    <div className="ps-tags">
                      {skills.split(",").map((s, i) => s.trim() && (
                        <span key={i} className="ps-tag">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ps-field">
                  <label>Weekly Availability (hours/week) <span className="ps-optional">(optional)</span></label>
                  <input
                    type="number" min="1" max="60"
                    placeholder="e.g. 20"
                    value={weeklyAvail}
                    onChange={e => setWeeklyAvail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="ps-step">
                <h3>Rates & Social Links</h3>

                <div className="ps-row">
                  <div className="ps-field">
                    <label>Hourly Rate (₹) <span className="ps-optional">(optional)</span></label>
                    <input
                      type="number" min="0"
                      placeholder="e.g. 500"
                      value={hourlyRate}
                      onChange={e => setHourlyRate(e.target.value)}
                    />
                  </div>
                  <div className="ps-field">
                    <label>Min Project Rate (₹) <span className="ps-optional">(optional)</span></label>
                    <input
                      type="number" min="0"
                      placeholder="e.g. 5000"
                      value={projectRate}
                      onChange={e => setProjectRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ps-field">
                  <label>LinkedIn URL <span className="ps-optional">(optional)</span></label>
                  <input
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                  />
                </div>

                <div className="ps-field">
                  <label>GitHub URL <span className="ps-optional">(optional)</span></label>
                  <input
                    placeholder="https://github.com/yourusername"
                    value={github}
                    onChange={e => setGithub(e.target.value)}
                  />
                </div>

                <div className="ps-field">
                  <label>Personal Website <span className="ps-optional">(optional)</span></label>
                  <input
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SME STEPS ── */}
        {role === "SME" && (
          <>
            {step === 1 && (
              <div className="ps-step">
                <h3>Company Information</h3>

                <div className="ps-field">
                  <label>Company Name <span className="ps-required">*</span></label>
                  <input
                    placeholder="Your company or business name"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="ps-field">
                  <label>Industry Type</label>
                  <select value={industryType} onChange={e => setIndustryType(e.target.value)}>
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="ps-field">
                  <label>Team Size</label>
                  <div className="ps-pill-group">
                    {TEAM_SIZES.map(s => (
                      <button
                        key={s} type="button"
                        className={`ps-pill ${teamSize === s ? "active" : ""}`}
                        onClick={() => setTeamSize(s)}
                      >
                        {s} people
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ps-field">
                  <label>Company Description <span className="ps-optional">(optional)</span></label>
                  <textarea
                    placeholder="What does your company do?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="ps-step">
                <h3>Project Preferences</h3>

                <div className="ps-field">
                  <label>Preferred Technologies <span className="ps-optional">(optional)</span></label>
                  <input
                    placeholder="React, Laravel, Flutter..."
                    value={preferredTech}
                    onChange={e => setPreferredTech(e.target.value)}
                  />
                  <span className="ps-hint">Comma separated</span>
                  {preferredTech && (
                    <div className="ps-tags">
                      {preferredTech.split(",").map((s, i) => s.trim() && (
                        <span key={i} className="ps-tag">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ps-row">
                  <div className="ps-field">
                    <label>Min Budget (₹) <span className="ps-optional">(optional)</span></label>
                    <input
                      type="number" min="0"
                      placeholder="e.g. 5000"
                      value={budgetMin}
                      onChange={e => setBudgetMin(e.target.value)}
                    />
                  </div>
                  <div className="ps-field">
                    <label>Max Budget (₹) <span className="ps-optional">(optional)</span></label>
                    <input
                      type="number" min="0"
                      placeholder="e.g. 50000"
                      value={budgetMax}
                      onChange={e => setBudgetMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="ps-field">
                  <label>Company Website <span className="ps-optional">(optional)</span></label>
                  <input
                    placeholder="https://yourcompany.com"
                    value={smeWebsite}
                    onChange={e => setSmeWebsite(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Navigation buttons */}
        <div className="ps-nav">
          {step > 1 && (
            <button className="ps-btn-back" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}

          <button
            className="ps-btn-skip"
            onClick={() => {
              if (step < totalSteps) setStep(s => s + 1);
              else handleSubmit();
            }}
          >
            Skip for now
          </button>

          {step < totalSteps ? (
            <button className="ps-btn-next" onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className="ps-btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Complete Profile ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
