import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FreelancerReviews from "./FreelancerReviews";
import "./Profile.css";

const API = "http://localhost:5000/api/auth";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Portfolio
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portTitle, setPortTitle] = useState("");
  const [portDesc, setPortDesc] = useState("");
  const [portLink, setPortLink] = useState("");
  const [portType, setPortType] = useState("live");
  const [portFile, setPortFile] = useState(null);
  const [portLoading, setPortLoading] = useState(false);

  // KYC
  const [kycFile, setKycFile] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

  // CV
  const [cvFile, setCvFile] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);

  // Profile Photo
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoLoading, setProfilePhotoLoading] = useState(false);

  // Edit form state
  const [form, setForm] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    const res = await fetch(`${API}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUser(data.user);
    initForm(data.user);
  };

  const initForm = (u) => {
    setForm({
      bio: u.bio || "",
      skills: (u.skills || []).join(", "),
      hourlyRate: u.hourlyRate || "",
      projectRate: u.projectRate || "",
      weeklyAvailability: u.weeklyAvailability || "",
      linkedin: u.socialLinks?.linkedin || "",
      github: u.socialLinks?.github || "",
      website: u.socialLinks?.website || "",
      companyName: u.companyName || "",
      industryType: u.industryType || "",
      teamSize: u.teamSize || "",
      preferredTechnologies: (u.preferredTechnologies || []).join(", "),
      budgetMin: u.budgetRange?.min || "",
      budgetMax: u.budgetRange?.max || "",
      smeWebsite: u.website || "",
      description: u.description || "",
    });
  };

  const fc = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    let body = {};
    if (user.role === "Freelancer") {
      body = {
        bio: form.bio,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        projectRate: form.projectRate ? Number(form.projectRate) : undefined,
        weeklyAvailability: form.weeklyAvailability
          ? Number(form.weeklyAvailability)
          : undefined,
        socialLinks: {
          linkedin: form.linkedin,
          github: form.github,
          website: form.website,
        },
      };
    } else {
      body = {
        companyName: form.companyName,
        industryType: form.industryType,
        teamSize: form.teamSize,
        preferredTechnologies: form.preferredTechnologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        budgetRange: {
          min: Number(form.budgetMin),
          max: Number(form.budgetMax),
        },
        website: form.smeWebsite,
        description: form.description,
      };
    }

    try {
      const res = await fetch(`${API}/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(data.user);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKYCUpload = async () => {
    if (!kycFile) return setError("Please select a file");

    setKycLoading(true);
    const fd = new FormData();
    fd.append("kycDocument", kycFile);

    try {
      const res = await fetch("http://localhost:5000/api/kyc/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser((prev) => ({
        ...prev,
        kycStatus: data.kycStatus,
        kycDocument: data.kycDocument,
      }));

      setSuccess("KYC uploaded!");
      setKycFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setKycLoading(false);
    }
  };

  const handleCVUpload = async () => {
    if (!cvFile) return setError("Please select a file");

    setCvLoading(true);
    const fd = new FormData();
    fd.append("cv", cvFile);

    try {
      const res = await fetch(`${API}/profile/cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser((prev) => ({
        ...prev,
        cv: data.cv,
      }));

      setSuccess("CV uploaded successfully!");
      setCvFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCvLoading(false);
    }
  };

  const handleCVDelete = async () => {
    if (!window.confirm("Delete your CV?")) return;

    try {
      const res = await fetch(`${API}/profile/cv`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser((prev) => ({
        ...prev,
        cv: "",
      }));

      setSuccess("CV deleted");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProfilePhotoUpload = async () => {
    if (!profilePhoto) return setError("Please select a photo");

    setProfilePhotoLoading(true);
    const fd = new FormData();
    fd.append("photo", profilePhoto);

    try {
      const res = await fetch(`${API}/profile/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser((prev) => ({
        ...prev,
        profilePhoto: data.profilePhoto,
      }));

      setSuccess("Profile photo uploaded successfully!");
      setProfilePhoto(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setProfilePhotoLoading(false);
    }
  };

  const handleDeleteProfilePhoto = async () => {
    if (!window.confirm("Delete your profile photo?")) return;

    try {
      const res = await fetch(`${API}/profile/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser((prev) => ({
        ...prev,
        profilePhoto: "",
      }));

      setSuccess("Profile photo deleted");
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="page-container">
      {success && <div className="profile-success">{success}</div>}
      {error && <div className="profile-error">{error}</div>}

      {/* ── Profile Card ── */}
      <div className="profile-card">
        <div className="profile-header">
          <div>
            <h1>{user.fullName}</h1>
            {user.companyName && <p className="profile-company">{user.companyName}</p>}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
            {user.role === "SME" && user.kycStatus === "Approved" && (
              <span className="profile-verified-badge">✓ Verified</span>
            )}
          </div>
        </div>

        {/* Profile Photo Section */}
        <div style={{ borderTop: "1px solid #e0d4c0", paddingTop: "16px", marginTop: "16px" }}>
          {user.profilePhoto ? (
            <div style={{ textAlign: "center" }}>
              <img 
                src={`http://localhost:5000/${user.profilePhoto}`} 
                alt="Profile" 
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "50%", 
                  objectFit: "cover",
                  border: "3px solid #b08968",
                  marginBottom: "12px"
                }} 
              />
              <button
                onClick={handleDeleteProfilePhoto}
                style={{
                  padding: "8px 16px",
                  background: "#c0392b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Remove Photo
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#a89880", marginBottom: "12px", textAlign: "center" }}>No profile photo yet</p>
          )}

          {editing && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "12px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #e0d4c0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={handleProfilePhotoUpload}
                disabled={!profilePhoto || profilePhotoLoading}
                style={{
                  padding: "10px 16px",
                  background: profilePhoto && !profilePhotoLoading ? "#b08968" : "#d0c0b0",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: profilePhoto && !profilePhotoLoading ? "pointer" : "not-allowed",
                }}
              >
                {profilePhotoLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
          )}
        </div>

        {/* Rating (if reviews exist) */}
        {user.totalReviews > 0 && (
          <div className="profile-rating-row">
            <span className="profile-stars">{"★".repeat(Math.round(user.averageRating))}{"☆".repeat(5 - Math.round(user.averageRating))}</span>
            <strong>{user.averageRating?.toFixed(1)}</strong> / 5
            <span className="profile-review-count">({user.totalReviews} {user.totalReviews === 1 ? "review" : "reviews"})</span>
          </div>
        )}

        {!editing ? (
          <>
            {/* View Mode */}
            <div className="profile-details">
              <div className="profile-field">
                <label>Email</label>
                <p>{user.email}</p>
              </div>

              {user.role === "Freelancer" ? (
                <>
                  {user.bio && (
                    <div className="profile-field">
                      <label>About</label>
                      <p>{user.bio}</p>
                    </div>
                  )}
                  {user.skills?.length > 0 && (
                    <div className="profile-field">
                      <label>Skills</label>
                      <div className="profile-tags">
                        {user.skills.map((s) => (
                          <span key={s} className="profile-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.hourlyRate && (
                    <div className="profile-field">
                      <label>Hourly Rate</label>
                      <p>₹{user.hourlyRate} / hour</p>
                    </div>
                  )}
                  {user.projectRate && (
                    <div className="profile-field">
                      <label>Project Rate</label>
                      <p>₹{user.projectRate} (min)</p>
                    </div>
                  )}
                  {user.weeklyAvailability && (
                    <div className="profile-field">
                      <label>Weekly Availability</label>
                      <p>{user.weeklyAvailability} hours/week</p>
                    </div>
                  )}
                  {(user.socialLinks?.linkedin || user.socialLinks?.github || user.socialLinks?.website) && (
                    <div className="profile-field">
                      <label>Social Links</label>
                      <div className="profile-social-links">
                        {user.socialLinks?.linkedin && (
                          <a href={user.socialLinks.linkedin} target="_blank" rel="noreferrer" className="profile-social-btn">
                            💼 LinkedIn
                          </a>
                        )}
                        {user.socialLinks?.github && (
                          <a href={user.socialLinks.github} target="_blank" rel="noreferrer" className="profile-social-btn">
                            🐙 GitHub
                          </a>
                        )}
                        {user.socialLinks?.website && (
                          <a href={user.socialLinks.website} target="_blank" rel="noreferrer" className="profile-social-btn">
                            🌐 Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {user.description && (
                    <div className="profile-field">
                      <label>Description</label>
                      <p>{user.description}</p>
                    </div>
                  )}
                  {user.industryType && (
                    <div className="profile-field">
                      <label>Industry</label>
                      <p>{user.industryType}</p>
                    </div>
                  )}
                  {user.teamSize && (
                    <div className="profile-field">
                      <label>Team Size</label>
                      <p>{user.teamSize}</p>
                    </div>
                  )}
                  {user.preferredTechnologies?.length > 0 && (
                    <div className="profile-field">
                      <label>Technologies</label>
                      <div className="profile-tags">
                        {user.preferredTechnologies.map((t) => (
                          <span key={t} className="profile-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(user.budgetRange?.min || user.budgetRange?.max) && (
                    <div className="profile-field">
                      <label>Budget Range</label>
                      <p>₹{user.budgetRange?.min?.toLocaleString()} – ₹{user.budgetRange?.max?.toLocaleString()}</p>
                    </div>
                  )}
                  {user.website && (
                    <div className="profile-field">
                      <label>Website</label>
                      <a href={user.website} target="_blank" rel="noreferrer" className="profile-link">{user.website}</a>
                    </div>
                  )}
                </>
              )}
            </div>

            <button className="profile-edit-btn" onClick={() => setEditing(true)}>
              ✎ Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* Edit Mode */}
            <form className="profile-edit-form">
              {user.role === "Freelancer" ? (
                <>
                  <div>
                    <label>About Me</label>
                    <textarea value={form.bio} onChange={fc("bio")} placeholder="Tell us about yourself..." />
                  </div>

                  <div>
                    <label>Skills (comma-separated)</label>
                    <input
                      type="text"
                      value={form.skills}
                      onChange={fc("skills")}
                      placeholder="React, Node.js, Python, ..."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label>Hourly Rate (₹)</label>
                      <input
                        type="number"
                        value={form.hourlyRate}
                        onChange={fc("hourlyRate")}
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label>Project Rate (₹)</label>
                      <input
                        type="number"
                        value={form.projectRate}
                        onChange={fc("projectRate")}
                        placeholder="10000"
                      />
                    </div>
                  </div>

                  <div>
                    <label>Weekly Availability (hours)</label>
                    <input
                      type="number"
                      value={form.weeklyAvailability}
                      onChange={fc("weeklyAvailability")}
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label>LinkedIn URL</label>
                    <input
                      type="url"
                      value={form.linkedin}
                      onChange={fc("linkedin")}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label>GitHub URL</label>
                    <input
                      type="url"
                      value={form.github}
                      onChange={fc("github")}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <label>Website URL</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={fc("website")}
                      placeholder="https://..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={fc("companyName")}
                      placeholder="Your company..."
                    />
                  </div>

                  <div>
                    <label>Description</label>
                    <textarea
                      value={form.description}
                      onChange={fc("description")}
                      placeholder="Tell us about your company..."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label>Industry Type</label>
                      <input
                        type="text"
                        value={form.industryType}
                        onChange={fc("industryType")}
                        placeholder="Software, Finance, ..."
                      />
                    </div>
                    <div>
                      <label>Team Size</label>
                      <select value={form.teamSize} onChange={fc("teamSize")}>
                        <option value="">Select team size</option>
                        <option value="1-5">1-5</option>
                        <option value="6-20">6-20</option>
                        <option value="21-50">21-50</option>
                        <option value="51-200">51-200</option>
                        <option value="200+">200+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>Technologies (comma-separated)</label>
                    <input
                      type="text"
                      value={form.preferredTechnologies}
                      onChange={fc("preferredTechnologies")}
                      placeholder="React, Node.js, Python, ..."
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label>Min Budget (₹)</label>
                      <input
                        type="number"
                        value={form.budgetMin}
                        onChange={fc("budgetMin")}
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <label>Max Budget (₹)</label>
                      <input
                        type="number"
                        value={form.budgetMax}
                        onChange={fc("budgetMax")}
                        placeholder="100000"
                      />
                    </div>
                  </div>

                  <div>
                    <label>Company Website</label>
                    <input
                      type="url"
                      value={form.smeWebsite}
                      onChange={fc("smeWebsite")}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="profile-save-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  style={{
                    padding: "12px 24px",
                    background: "#f7f1e8",
                    border: "1px solid #e0d4c0",
                    borderRadius: "8px",
                    color: "#4a3728",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* ── KYC Section (SME & Freelancer) ── */}
      {(user.role === "SME" || user.role === "Freelancer") && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>KYC Verification</h3>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                padding: "5px 12px",
                borderRadius: "20px",
                color: user.kycStatus === "Approved" ? "#1a5c38" : user.kycStatus === "Rejected" ? "#8b2e1f" : "#6b5c3f",
                background: user.kycStatus === "Approved" ? "#d4f0e0" : user.kycStatus === "Rejected" ? "#ffe4e1" : "#f9f0e0",
                border: `1px solid ${user.kycStatus === "Approved" ? "#a8dfc0" : user.kycStatus === "Rejected" ? "#ffc1d0" : "#e0d4c0"}`,
              }}
            >
              {user.kycStatus}
            </span>
          </div>

          {user.kycDocument && (
            <p style={{ marginBottom: "12px", fontSize: "14px", color: "#a89880" }}>
              Current Document:{" "}
              <a href={`http://localhost:5000/${user.kycDocument}`} target="_blank" rel="noreferrer" className="profile-link">
                📄 View
              </a>
            </p>
          )}

          {!user.kycDocument || user.kycStatus === "Rejected" ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #e0d4c0",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={handleKYCUpload}
                disabled={!kycFile || kycLoading}
                style={{
                  padding: "10px 20px",
                  background: kycFile && !kycLoading ? "#b08968" : "#d0c0b0",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: kycFile && !kycLoading ? "pointer" : "not-allowed",
                }}
              >
                {kycLoading ? "Uploading..." : "Upload"}
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: user.kycStatus === "Approved" ? "#4a9b6f" : "#8b4513", fontWeight: "600" }}>
              {user.kycStatus === "Approved" ? "✓ KYC verified successfully" : "⏳ Awaiting admin review"}
            </p>
          )}

          {user.kycNote && (
            <p style={{ marginTop: "12px", fontSize: "13px", color: "#8b4513", fontStyle: "italic" }}>
              Admin Note: {user.kycNote}
            </p>
          )}
        </div>
      )}

      {/* ── CV Section (Freelancer only) ── */}
      {user.role === "Freelancer" && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>CV</h3>
          </div>

          {user.cv ? (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
              <a
                href={`http://localhost:5000/${user.cv}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "#f7f1e8",
                  border: "1px solid #e0d4c0",
                  borderRadius: "8px",
                  color: "#b08968",
                  textDecoration: "none",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                📄 Download CV
              </a>
              <button
                onClick={handleCVDelete}
                style={{
                  padding: "12px 16px",
                  background: "#f5c6c0",
                  color: "#c0392b",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "#a89880", marginBottom: "12px" }}>No CV uploaded yet</p>
          )}

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCvFile(e.target.files?.[0] || null)}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #e0d4c0",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handleCVUpload}
              disabled={!cvFile || cvLoading}
              style={{
                padding: "10px 20px",
                background: cvFile && !cvLoading ? "#b08968" : "#d0c0b0",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: cvFile && !cvLoading ? "pointer" : "not-allowed",
              }}
            >
              {cvLoading ? "Uploading..." : "Upload CV"}
            </button>
          </div>
        </div>
      )}

      {/* ── Portfolio Section (Freelancer only) ── */}
      {user.role === "Freelancer" && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Portfolio</h3>
            <button className="profile-add-btn" onClick={() => setShowPortfolioForm(true)}>
              + Add Item
            </button>
          </div>

          {showPortfolioForm && (
            <div className="portfolio-form">
              <input
                type="text"
                placeholder="Project Title"
                value={portTitle}
                onChange={(e) => setPortTitle(e.target.value)}
              />
              <textarea
                placeholder="Description"
                value={portDesc}
                onChange={(e) => setPortDesc(e.target.value)}
                rows={3}
              />
              <input
                type="url"
                placeholder="Live URL or GitHub link"
                value={portLink}
                onChange={(e) => setPortLink(e.target.value)}
              />
              <select value={portType} onChange={(e) => setPortType(e.target.value)}>
                <option value="live">Live Demo</option>
                <option value="github">GitHub</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
              </select>
              {portType !== "live" && portType !== "github" && (
                <input
                  type="file"
                  onChange={(e) => setPortFile(e.target.files?.[0] || null)}
                />
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="profile-add-btn"
                  onClick={async () => {
                    // TODO: Implement portfolio upload
                    setShowPortfolioForm(false);
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowPortfolioForm(false)}
                  style={{
                    padding: "7px 16px",
                    background: "#f7f1e8",
                    border: "1px solid #e0d4c0",
                    borderRadius: "8px",
                    color: "#4a3728",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {user.portfolio?.length === 0 ? (
            <div className="profile-empty">No portfolio items yet</div>
          ) : (
            <div className="portfolio-grid">
              {user.portfolio?.map((item) => (
                <div key={item._id} className="portfolio-card">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="profile-link">
                      View {item.type === "github" ? "on GitHub" : ""}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reviews ── */}
      <div style={{ paddingBottom: 40 }}>
        <FreelancerReviews userId={user._id} />
      </div>
    </div>
  );
}