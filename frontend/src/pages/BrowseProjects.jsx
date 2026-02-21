import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./project.css";

export default function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [skill, setSkill] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams();
      if (skill) params.append("skill", skill);

      const res = await fetch(
        `http://localhost:5000/api/projects?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch projects");

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setProjects([]);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [skill, location.key]); // fetch on skill change or route change

  return (
    <div className="page-container">
      <h1>Browse Projects</h1>

      <div className="browse-layout">
        {/* Filters Section */}
        <div className="filters">
          <h4>Filter by Skill</h4>
          <input
            type="text"
            placeholder="Enter skill"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
          <button onClick={fetchProjects}>Apply Filter</button>
        </div>

        {/* Projects Section */}
        <div className="projects">
          {projects.length === 0 && <p>No projects found</p>}

          {projects.map((p) => (
            <div className="project-card" key={p._id}>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              {/* ✅ FIXED: Show in NPR with ₹ symbol */}
              <p>
                Budget: ₹{p.budgetMin?.toLocaleString()} – ₹{p.budgetMax?.toLocaleString()}
              </p>
              <p>Posted by: {p.postedBy?.fullName || "SME"}</p>

              <button onClick={() => navigate(`/dashboard/apply/${p._id}`)}>
                Apply
              </button>

              {p.skills && (
                <div className="tags">
                  {p.skills.map((skillTag, idx) => (
                    <span key={idx}>{skillTag}</span>
                  ))}
                </div>
              )}

              <span className={`status ${p.status?.toLowerCase() || "open"}`}>
                {p.status || "Open"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

