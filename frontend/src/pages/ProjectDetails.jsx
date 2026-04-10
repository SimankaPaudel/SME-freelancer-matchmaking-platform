import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RatingDisplay from "../components/RatingDisplay";
import "./Project.css";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [sme, setSme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proposalCount, setProposalCount] = useState(0);
  const token = localStorage.getItem("accessToken");

  console.log("🔍 ProjectDetails component mounted");
  console.log("Project ID from URL:", projectId);

  useEffect(() => {
    console.log("useEffect triggered");
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("==== ProjectDetails Debug ====");
      console.log("Fetching project ID:", projectId);
      console.log("Token available:", !!token);

      // Fetch project details
      const projectRes = await fetch(
        `http://localhost:5000/api/projects/${projectId}`
      );

      console.log("API Response Status:", projectRes.status);
      console.log("API Response OK:", projectRes.ok);

      if (!projectRes.ok) {
        const errorData = await projectRes.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.message || `Server returned ${projectRes.status}`);
      }

      const projectData = await projectRes.json();
      console.log("Project data received:", projectData);
      console.log("Project ID in data:", projectData._id);
      console.log("Posted by:", projectData.postedBy);
      
      setProject(projectData);

      // SME data is already populated in projectData.postedBy
      if (projectData.postedBy) {
        console.log("Setting SME data:", projectData.postedBy);
        setSme(projectData.postedBy);
      }

      // Fetch proposal count
      try {
        const countRes = await fetch(
          `http://localhost:5000/api/proposals/project/${projectId}/count`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const countData = await countRes.json();
        console.log("Proposal count:", countData.count);
        setProposalCount(countData.count || 0);
      } catch (countErr) {
        console.warn("Failed to fetch proposal count:", countErr);
        setProposalCount(0);
      }
      
      console.log("==== Fetch Complete ====");
    } catch (err) {
      console.error("==== Fetch Error ====");
      console.error(err);
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil(
      (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const handleApply = () => {
    navigate(`/dashboard/apply/${projectId}`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#999"
        }}>
          <div style={{
            fontSize: "20px",
            marginBottom: "20px"
          }}>⏳ Loading project details...</div>
          <p style={{ fontSize: "12px", color: "#b08968" }}>
            Project ID: {projectId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{
          marginTop: "20px",
          background: "#fff5f5",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #f8d0d0"
        }}>
          <p style={{ color: "#c0392b", fontSize: "16px", fontWeight: "600", margin: 0 }}>
            ❌ Error Loading Project
          </p>
          <p style={{ color: "#c0392b", margin: "10px 0 0 0" }}>
            {error}
          </p>
          <p style={{ fontSize: "12px", color: "#999", margin: "10px 0 0 0" }}>
            Project ID: {projectId}
          </p>
          <button 
            onClick={() => { setLoading(true); fetchProjectDetails(); }}
            style={{
              marginTop: "15px",
              padding: "8px 16px",
              background: "#d4af8c",
              border: "none",
              borderRadius: "6px",
              color: "white",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div style={{
          marginTop: "20px",
          textAlign: "center",
          padding: "40px",
          color: "#999"
        }}>
          <p style={{ fontSize: "16px" }}>📭 Project not found</p>
          <p style={{ fontSize: "12px" }}>Project ID: {projectId}</p>
        </div>
      </div>
    );
  }

  const days = daysLeft(project.deadline);
  const isDeadlinePassed = days < 0;
  const isDeadlineSoon = days <= 3;

  return (
    <div className="page-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="project-details-container">
        {/* Header */}
        <div className="project-header">
          <div className="header-left">
            <h1>{project.title}</h1>
            <p className="project-description">{project.description}</p>
          </div>
          <div className="header-right">
            <div className="budget-box">
              <div className="budget-label">Budget</div>
              <div className="budget-value">
                ₹{project.budgetMin?.toLocaleString()} - ₹{project.budgetMax?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Project Meta */}
        <div className="project-meta">
          <div className="meta-item">
            <span className="meta-label">📅 Deadline:</span>
            <span
              className={`meta-value ${
                isDeadlinePassed ? "deadline-passed" : isDeadlineSoon ? "deadline-soon" : ""
              }`}
            >
              {new Date(project.deadline).toLocaleDateString()} ({days} days left)
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">📊 Level:</span>
            <span className="meta-value">{project.experienceLevel || "Intermediate"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">👥 Proposals:</span>
            <span className="meta-value">{proposalCount}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">📍 Status:</span>
            <span className="meta-value">{project.status || "Open"}</span>
          </div>
        </div>

        {/* Skills */}
        {project.skills && project.skills.length > 0 && (
          <div className="project-section">
            <h2>Required Skills</h2>
            <div className="skills-display">
              {project.skills.map((skill, idx) => (
                <span key={idx} className="skill-badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Description */}
        {project.detailedDescription && (
          <div className="project-section">
            <h2>Project Details</h2>
            <div className="detailed-description">
              {project.detailedDescription}
            </div>
          </div>
        )}

        {/* SME Profile Section */}
        {sme && (
          <div className="project-section">
            <h2>Posted By</h2>
            <div className="sme-profile-card">
              <div className="sme-info">
                <h3>{sme.companyName || sme.fullName}</h3>
                <p className="sme-email">📧 {sme.email}</p>
                {sme.description && (
                  <p className="sme-description">{sme.description}</p>
                )}
              </div>
              <RatingDisplay userId={sme._id} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="project-actions">
          <button className="btn-primary" onClick={handleApply}>
            ✨ Apply for This Project
          </button>
          {sme && (
            <button
              className="btn-secondary"
              onClick={() => navigate(`/profile/${sme._id}`)}
            >
              👤 View SME Profile
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .project-details-container {
          max-width: 900px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .back-btn {
          background: #e8dcc8;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 20px;
          color: #333;
        }

        .back-btn:hover {
          background: #d4af8c;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #e8dcc8;
          padding-bottom: 20px;
        }

        .header-left {
          flex: 1;
        }

        .project-header h1 {
          font-size: 28px;
          margin: 0 0 10px 0;
          color: #333;
        }

        .project-description {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.6;
        }

        .header-right {
          margin-left: 20px;
        }

        .budget-box {
          background: linear-gradient(135deg, #d4af8c 0%, #b08968 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          min-width: 150px;
        }

        .budget-label {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.9;
        }

        .budget-value {
          font-size: 18px;
          font-weight: 700;
          margin-top: 5px;
        }

        .project-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          background: #f5f0e8;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .meta-label {
          font-weight: 600;
          color: #666;
          min-width: fit-content;
        }

        .meta-value {
          color: #333;
        }

        .deadline-passed {
          color: #c0392b;
          font-weight: 600;
        }

        .deadline-soon {
          color: #e67e22;
          font-weight: 600;
        }

        .project-section {
          margin-bottom: 30px;
        }

        .project-section h2 {
          font-size: 18px;
          margin: 0 0 15px 0;
          color: #333;
          border-bottom: 2px solid #d4af8c;
          padding-bottom: 10px;
        }

        .skills-display {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .skill-badge {
          background: #d4af8c;
          color: white;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .detailed-description {
          background: #f5f0e8;
          padding: 20px;
          border-radius: 8px;
          line-height: 1.8;
          color: #333;
          white-space: pre-wrap;
        }

        .sme-profile-card {
          background: #f5f0e8;
          padding: 20px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sme-info {
          flex: 1;
        }

        .sme-profile-card h3 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .sme-email,
        .sme-description {
          margin: 5px 0;
          color: #666;
          font-size: 13px;
        }

        .project-actions {
          display: flex;
          gap: 15px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e8dcc8;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #d4af8c 0%, #b08968 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212, 175, 140, 0.4);
        }

        .btn-secondary {
          background: #e8dcc8;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d4af8c;
        }

        .loading-spinner {
          text-align: center;
          padding: 40px;
          color: #999;
        }
      `}</style>
    </div>
  );
}
