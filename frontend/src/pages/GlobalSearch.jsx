import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GlobalSearch.css";

export default function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState({
    projects: [],
    freelancers: [],
    smes: [],
  });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user"));

  // Determine search mode based on user role
  const isSME = user?.role === "SME";
  const isFreelancer = user?.role === "Freelancer";



  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearched(query.trim() !== "");

    if (!query.trim()) {
      setResults({ projects: [], freelancers: [], smes: [] });
      return;
    }

    setLoading(true);

    const authHeader = { Authorization: `Bearer ${token}` };

    try {
      // Both SMEs and Freelancers can search all three categories
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const projectRes = await fetch(
        `${API_BASE_URL}/projects?search=${query}`,
        { headers: authHeader }
      );
      const projectData = await projectRes.json();

      const freelancerRes = await fetch(
        `${API_BASE_URL}/auth/search-freelancers?q=${query}`,
        { headers: authHeader }
      );
      const freelancerData = await freelancerRes.json();

      const smeRes = await fetch(
        `${API_BASE_URL}/auth/search-smes?q=${query}`,
        { headers: authHeader }
      );
      const smeData = await smeRes.json();

      setResults({
        projects: Array.isArray(projectData) ? projectData : [],
        freelancers: Array.isArray(freelancerData) ? freelancerData : [],
        smes: Array.isArray(smeData) ? smeData : [],
      });
    } catch (err) {
      setResults({ projects: [], freelancers: [], smes: [] });
    } finally {
      setLoading(false);
    }
  };

  const totalResults =
    results.projects.length +
    results.freelancers.length +
    results.smes.length;



  return (
    <div className="page-container global-search-container">
      <h1>Global Search</h1>

      {/* Search Form */}
      <div className="gs-search-form">
        <div className="gs-search-input-group">
          <input
            type="text"
            placeholder="Search for projects, freelancers, or businesses..."
            value={searchQuery}
            onChange={handleSearch}
            className="gs-input"
            autoFocus
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="gs-loading">
          <div className="gs-spinner"></div>
          Searching...
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          {totalResults === 0 ? (
            <div className="gs-no-results">
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="gs-results">
              {/* Projects Results - Show to Everyone */}
              {results.projects.length > 0 && (
                <div className="gs-section">
                  <h2>Projects ({results.projects.length})</h2>
                  <div className="gs-items">
                    {results.projects.map((project) => (
                      <div key={project._id} className="gs-item project-item">
                        <div className="gs-item-header">
                          <h3>{project.title}</h3>
                          <span className="gs-badge project">Project</span>
                        </div>
                        <p className="gs-item-desc">{project.description?.substring(0, 100)}...</p>
                        <div className="gs-item-meta">
                          <span>₹{project.budgetMin} - ₹{project.budgetMax}</span>
                          <span>{project.experienceLevel}</span>
                        </div>
                        {isFreelancer && (
                          <button
                            className="gs-action-btn"
                            onClick={() => navigate(`/dashboard/apply/${project._id}`)}
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Freelancers Results - Show to Everyone */}
              {results.freelancers.length > 0 && (
                <div className="gs-section">
                  <h2>Freelancers ({results.freelancers.length})</h2>
                  <div className="gs-items">
                    {results.freelancers.map((freelancer) => (
                      <div key={freelancer._id} className="gs-item freelancer-item">
                        <div className="gs-item-header">
                          <h3>{freelancer.fullName}</h3>
                          <span className="gs-badge freelancer">Freelancer</span>
                        </div>
                        <p className="gs-item-skills">
                          {freelancer.skills?.slice(0, 3).join(", ")}
                        </p>
                        <div className="gs-item-meta">
                          <span>⭐ {freelancer.averageRating?.toFixed(1) || "N/A"}</span>
                          <span>₹{freelancer.hourlyRate}/hr</span>
                        </div>
                        <button
                          className="gs-action-btn"
                          onClick={() => navigate(`/dashboard/profile/${freelancer._id}`)}
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SMEs Results - Show to Everyone */}
              {results.smes.length > 0 && (
                <div className="gs-section">
                  <h2>Businesses ({results.smes.length})</h2>
                  <div className="gs-items">
                    {results.smes.map((sme) => (
                      <div key={sme._id} className="gs-item sme-item">
                        <div className="gs-item-header">
                          <h3>{sme.companyName || sme.fullName}</h3>
                          <span className="gs-badge sme">Business</span>
                        </div>
                        <p className="gs-item-desc">{sme.companyDescription?.substring(0, 100)}</p>
                        <div className="gs-item-meta">
                          <span>{sme.email}</span>
                        </div>
                        <button
                          className="gs-action-btn"
                          onClick={() => navigate(`/profile/${sme._id}`)}
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!searched && (
        <div className="gs-placeholder">
          {!token ? (
            <p>Please log in to use the search feature</p>
          ) : (
            <p>Search for projects, freelancers, or businesses to get started</p>
          )}
        </div>
      )}
    </div>
  );
}
