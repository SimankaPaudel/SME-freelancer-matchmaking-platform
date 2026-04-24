import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Project.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/projects/mine`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch projects");

        const data = await res.json();
        setProjects(data);
      } catch (err) {
        
        alert("Failed to fetch projects. Check login and token.");
      }
    };

    fetchProjects();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      setProjects((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status } : p))
      );
    } catch (err) {
      
      alert("Failed to update status: " + err.message);
    }
  };

  const extendDeadline = async (project, newDate) => {
    if (!newDate) return;

    try {
      const isoDate = new Date(newDate).toISOString();

      const res = await fetch(
        `${API_BASE_URL}/projects/${project._id}/deadline`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ newDeadline: isoDate }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update deadline");

      setProjects((prev) =>
        prev.map((p) =>
          p._id === project._id ? { ...p, deadline: data.project.deadline } : p
        )
      );

      alert("Deadline updated successfully!");
    } catch (err) {
      
      alert("Failed to update deadline: " + err.message);
    }
  };

  const toggleEdit = (project) => {
    if (editingId === project._id) {
      setEditingId(null);
      setEditForm({});
    } else {
      setEditingId(project._id);
      setEditForm({
        title: project.title,
        description: project.description,
        skills: project.skills?.join(", ") || "",
        experienceLevel: project.experienceLevel,
        budgetMin: project.budgetMin,
        budgetMax: project.budgetMax,
        deadline: project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : "",
      });
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveProjectChanges = async (projectId) => {
    try {
      // Validate inputs
      if (!editForm.title?.trim()) throw new Error("Title is required");
      if (!editForm.description?.trim()) throw new Error("Description is required");
      if (!editForm.experienceLevel) throw new Error("Experience level is required");
      if (!editForm.budgetMin || isNaN(Number(editForm.budgetMin))) throw new Error("Valid minimum budget is required");
      if (!editForm.budgetMax || isNaN(Number(editForm.budgetMax))) throw new Error("Valid maximum budget is required");
      if (Number(editForm.budgetMin) > Number(editForm.budgetMax)) throw new Error("Minimum budget cannot exceed maximum budget");
      if (!editForm.deadline) throw new Error("Deadline is required");

      // Convert date to ISO format
      const deadlineDate = new Date(editForm.deadline);
      if (isNaN(deadlineDate.getTime())) throw new Error("Invalid deadline date");

      const updatedData = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        skills: editForm.skills.split(",").map((s) => s.trim()).filter(s => s),
        experienceLevel: editForm.experienceLevel,
        budgetMin: Number(editForm.budgetMin),
        budgetMax: Number(editForm.budgetMax),
        deadline: deadlineDate.toISOString(),
      };

      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update project");

      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? data.project : p))
      );

      setEditingId(null);
      setEditForm({});
      alert("Project updated successfully!");
    } catch (err) {
      
      alert("Failed to update project: " + err.message);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: "28px" }}>
        <h1>ðŸ—‚ï¸ Manage Your Projects</h1>
        <p style={{ fontSize: "15px", color: "#7a6a55", margin: "12px 0 0 0" }}>
          {projects.length === 0 
            ? "No projects yet. Create your first project to get started."
            : `You have ${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {projects.length === 0 && (
        <div style={{
          background: "#fef9f4",
          border: "1px solid #e0d4c0",
          borderRadius: "14px",
          padding: "48px 29px",
          textAlign: "center",
          color: "#7a6a55"
        }}>
          <p style={{ fontSize: "16px", margin: "0" }}>ðŸ“­ No projects found yet</p>
          <p style={{ fontSize: "14px", margin: "8px 0 0 0" }}>
            Start by posting your first project to connect with freelancers
          </p>
        </div>
      )}

      {projects.map((p) => (
        <div className="project-card" key={p._id}>
          {editingId === p._id ? (
            <div className="edit-form">
              <h3>âœï¸ Edit Project</h3>
              <div className="form-group">
                <label>ðŸ“Œ Project Title</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title || ""}
                  onChange={handleEditChange}
                  maxLength="100"
                  placeholder="Enter project title"
                />
              </div>

              <div className="form-group">
                <label>ðŸ“ Description</label>
                <textarea
                  name="description"
                  value={editForm.description || ""}
                  onChange={handleEditChange}
                  rows="4"
                  placeholder="Describe your project in detail"
                />
              </div>

              <div className="form-group">
                <label>ðŸ› ï¸ Required Skills</label>
                <input
                  type="text"
                  name="skills"
                  value={editForm.skills || ""}
                  onChange={handleEditChange}
                  placeholder="e.g., React, Node.js, MongoDB"
                />
              </div>

              <div className="form-group">
                <label>ðŸ‘¤ Experience Level</label>
                <select
                  name="experienceLevel"
                  value={editForm.experienceLevel || ""}
                  onChange={handleEditChange}
                >
                  <option value="">Select level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ðŸ’° Budget Min (â‚¹)</label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={editForm.budgetMin || ""}
                    onChange={handleEditChange}
                    placeholder="Minimum budget"
                  />
                </div>
                <div className="form-group">
                  <label>ðŸ’° Budget Max (â‚¹)</label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={editForm.budgetMax || ""}
                    onChange={handleEditChange}
                    placeholder="Maximum budget"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ðŸ“… Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={editForm.deadline || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="edit-actions">
                <button
                  className="success"
                  onClick={() => saveProjectChanges(p._id)}
                >
                  âœ… Save Changes
                </button>
                <button
                  className="cancel"
                  onClick={() => toggleEdit(p)}
                >
                  âŒ Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <h3>ðŸ“‹ {p.title}</h3>
                  <p style={{ color: "#7a6a55", fontSize: "14px", lineHeight: "1.6", margin: "8px 0" }}>
                    {p.description}
                  </p>
                </div>
                <span className={`status ${p.status.toLowerCase()}`} style={{ whiteSpace: "nowrap" }}>
                  {p.status}
                </span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                padding: "16px 0",
                borderTop: "1px solid #e0d4c0",
                borderBottom: "1px solid #e0d4c0"
              }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#a89880", textTransform: "uppercase", fontWeight: "600" }}>Skills</span>
                  <p style={{ margin: "6px 0 0", color: "#4a3728", fontSize: "13px" }}>
                    {p.skills?.length > 0 ? p.skills.join(", ") : "N/A"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#a89880", textTransform: "uppercase", fontWeight: "600" }}>Level</span>
                  <p style={{ margin: "6px 0 0", color: "#4a3728", fontSize: "13px" }}>
                    {p.experienceLevel}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#a89880", textTransform: "uppercase", fontWeight: "600" }}>Budget</span>
                  <p style={{ margin: "6px 0 0", color: "#4a3728", fontSize: "13px" }}>
                    â‚¹{p.budgetMin?.toLocaleString() || "0"} â€“ â‚¹{p.budgetMax?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#a89880", textTransform: "uppercase", fontWeight: "600" }}>Deadline</span>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
                  <input
                    type="date"
                    value={p.deadline ? new Date(p.deadline).toISOString().slice(0, 10) : ""}
                    onChange={(e) => extendDeadline(p, e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e0d4c0",
                      fontSize: "13px",
                      flex: 1
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#7a6a55" }}>
                    {p.deadline && new Date(p.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="actions" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e0d4c0" }}>
                <button
                  className="info"
                  onClick={() =>
                    navigate("/dashboard/applicants", { state: { projectId: p._id } })
                  }
                  title="View all applicants for this project"
                >
                  ðŸ‘¥ View Applicants
                </button>

                <button
                  className="primary"
                  onClick={() => navigate(`/dashboard/matched-freelancers/${p._id}`)}
                  title="See AI-matched freelancers"
                >
                  â­ Matched Freelancers
                </button>

                <button
                  className="edit"
                  onClick={() => toggleEdit(p)}
                  title="Edit project details"
                >
                  âœï¸ Edit
                </button>

                {p.status.toLowerCase() !== "closed" && (
                  <button
                    className="danger"
                    onClick={() => updateStatus(p._id, "Closed")}
                    title="Close this project"
                  >
                    ðŸ”’ Close
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
