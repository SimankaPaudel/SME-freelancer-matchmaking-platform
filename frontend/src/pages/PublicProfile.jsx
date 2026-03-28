import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RatingDisplay from "../components/RatingDisplay";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicProfile();
  }, [userId]);

  const fetchPublicProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/auth/profile/${userId}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Failed to load profile");
        return;
      }
      
      setUser(data.user);
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="public-profile-container"><p>Loading profile...</p></div>;
  if (error) return <div className="public-profile-container"><p style={{ color: "#c0392b" }}>❌ {error}</p></div>;
  if (!user) return <div className="public-profile-container"><p>User not found</p></div>;

  return (
    <div className="public-profile-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="public-profile-header">
        <div className="header-info">
          <h1>{user.fullName}</h1>
          <p className="email">📧 {user.email}</p>
          {user.kycStatus === "Approved" && (
            <span className="kyc-badge">✓ KYC Verified</span>
          )}
        </div>

        <RatingDisplay userId={user._id} />
      </div>

      {/* Freelancer Profile */}
      {user.role === "Freelancer" ? (
        <div className="profile-content">
          {user.bio && (
            <section className="profile-section">
              <h2>About</h2>
              <p>{user.bio}</p>
            </section>
          )}

          {user.skills?.length > 0 && (
            <section className="profile-section">
              <h2>Skills</h2>
              <div className="skills-grid">
                {user.skills.map((skill, i) => (
                  <span key={i} className="skill-badge">{skill}</span>
                ))}
              </div>
            </section>
          )}

          <section className="profile-section">
            <h2>Rates</h2>
            <div className="rates-grid">
              {user.hourlyRate && (
                <div className="rate-item">
                  <span className="rate-label">Hourly Rate</span>
                  <span className="rate-value">₹{user.hourlyRate.toLocaleString()}/hr</span>
                </div>
              )}
              {user.projectRate && (
                <div className="rate-item">
                  <span className="rate-label">Min Project Rate</span>
                  <span className="rate-value">₹{user.projectRate.toLocaleString()}</span>
                </div>
              )}
              {user.weeklyAvailability && (
                <div className="rate-item">
                  <span className="rate-label">Weekly Availability</span>
                  <span className="rate-value">{user.weeklyAvailability} hours</span>
                </div>
              )}
            </div>
          </section>

          {user.portfolio?.length > 0 && (
            <section className="profile-section">
              <h2>Portfolio</h2>
              <div className="portfolio-grid">
                {user.portfolio.map((item, i) => (
                  <div key={i} className="portfolio-item">
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    <div className="portfolio-links">
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                          🔗 View
                        </a>
                      )}
                      {item.fileUrl && (
                        <a href={`http://localhost:5000/${item.fileUrl}`} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                          📄 Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {user.cv && (
            <section className="profile-section">
              <h2>Curriculum Vitae</h2>
              <a href={`http://localhost:5000/${user.cv}`} target="_blank" rel="noopener noreferrer" className="cv-download-btn">
                📥 Download CV
              </a>
            </section>
          )}

          {(user.socialLinks?.linkedin || user.socialLinks?.github || user.socialLinks?.website) && (
            <section className="profile-section">
              <h2>Connect</h2>
              <div className="social-links">
                {user.socialLinks?.linkedin && (
                  <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-btn linkedin">
                    💼 LinkedIn
                  </a>
                )}
                {user.socialLinks?.github && (
                  <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-btn github">
                    🐙 GitHub
                  </a>
                )}
                {user.socialLinks?.website && (
                  <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="social-btn website">
                    🌐 Website
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      ) : (
        // SME Profile
        <div className="profile-content">
          {user.description && (
            <section className="profile-section">
              <h2>About Company</h2>
              <p>{user.description}</p>
            </section>
          )}

          <section className="profile-section">
            <h2>Company Information</h2>
            <div className="info-grid">
              {user.companyName && (
                <div className="info-item">
                  <span className="label">Company Name</span>
                  <span className="value">{user.companyName}</span>
                </div>
              )}
              {user.industryType && (
                <div className="info-item">
                  <span className="label">Industry</span>
                  <span className="value">{user.industryType}</span>
                </div>
              )}
              {user.teamSize && (
                <div className="info-item">
                  <span className="label">Team Size</span>
                  <span className="value">{user.teamSize}</span>
                </div>
              )}
              {(user.budgetRange?.min || user.budgetRange?.max) && (
                <div className="info-item">
                  <span className="label">Budget Range</span>
                  <span className="value">₹{user.budgetRange?.min?.toLocaleString()} – ₹{user.budgetRange?.max?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </section>

          {user.preferredTechnologies?.length > 0 && (
            <section className="profile-section">
              <h2>Preferred Technologies</h2>
              <div className="skills-grid">
                {user.preferredTechnologies.map((tech, i) => (
                  <span key={i} className="skill-badge">{tech}</span>
                ))}
              </div>
            </section>
          )}

          {user.website && (
            <section className="profile-section">
              <h2>Website</h2>
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="website-link">
                🌐 {user.website}
              </a>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
