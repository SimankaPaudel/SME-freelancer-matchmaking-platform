import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./project.css";

export default function ManageProjects() {
  const [projects, setProjects] = useState([]);
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

  return (
    <div className="page-container">
      <h1>Manage Projects</h1>

      {projects.length === 0 && <p>No projects found.</p>}

      {projects.map((p) => (
        <div className="project-card" key={p._id}>
          <h3>{p.title}</h3>
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

            {p.status.toLowerCase() !== "closed" && (
              <button
                className="danger"
                onClick={() => updateStatus(p._id, "Closed")}
              >
                Close
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
