import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Project.css";

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/projects/mine", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch projects");

        const data = await res.json();
        console.log("Projects fetched:", data);
        setProjects(data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch projects. Check login and token.");
      }
    };

    fetchProjects();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/status`, {
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
      console.error(err);
      alert("Failed to update status: " + err.message);
    }
  };

  const extendDeadline = async (project, newDate) => {
    if (!newDate) return;

    try {
      const isoDate = new Date(newDate).toISOString();

      const res = await fetch(
        `http://localhost:5000/api/projects/${project._id}/deadline`,
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
      console.error(err);
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

      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
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
      console.error(err);
      alert("Failed to update project: " + err.message);
    }
  };

  return (
    <div className="page-container">
      <h1>Manage Projects</h1>

      {projects.length === 0 && <p>No projects found.</p>}

      {projects.map((p) => (
        <div className="project-card" key={p._id}>
          {editingId === p._id ? (
            <div className="edit-form">
              <h3>Edit Project</h3>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title || ""}
                  onChange={handleEditChange}
                  maxLength="100"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={editForm.description || ""}
                  onChange={handleEditChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Skills (comma-separated):</label>
                <input
                  type="text"
                  name="skills"
                  value={editForm.skills || ""}
                  onChange={handleEditChange}
                  placeholder="e.g., React, Node.js, MongoDB"
                />
              </div>

              <div className="form-group">
                <label>Experience Level:</label>
                <select
                  name="experienceLevel"
                  value={editForm.experienceLevel || ""}
                  onChange={handleEditChange}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget Min:</label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={editForm.budgetMin || ""}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Budget Max:</label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={editForm.budgetMax || ""}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Deadline:</label>
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
                  Save Changes
                </button>
                <button
                  className="cancel"
                  onClick={() => toggleEdit(p)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <p>
                Skills: {p.skills?.length > 0 ? p.skills.join(", ") : "N/A"}
              </p>
              <p>Experience Level: {p.experienceLevel}</p>
              <p>
                Status: <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>
              </p>
              <p>
                Deadline:{" "}
                <input
                  type="date"
                  value={p.deadline ? new Date(p.deadline).toISOString().slice(0, 10) : ""}
                  onChange={(e) => extendDeadline(p, e.target.value)}
                />
              </p>
              <p>
                Budget: {p.budgetMin} – {p.budgetMax}
              </p>
              <p>Posted by: {p.postedBy?.fullName || "SME"}</p>

              <div className="actions">
                <button
                  className="info"
                  onClick={() =>
                    navigate("/dashboard/applicants", { state: { projectId: p._id } })
                  }
                >
                  View Applicants
                </button>

                <button
                  className="primary"
                  onClick={() => navigate(`/dashboard/matched-freelancers/${p._id}`)}
                >
                  Matched Freelancers
                </button>

                <button
                  className="edit"
                  onClick={() => toggleEdit(p)}
                >
                  Edit Project
                </button>

                {p.status.toLowerCase() !== "closed" && (
                  <button
                    className="danger"
                    onClick={() => updateStatus(p._id, "Closed")}
                  >
                    Close
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
