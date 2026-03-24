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
    } catch (err) {
      setError(err.message);
    } finally {
      setKycLoading(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="page-container">
      {success && <div className="profile-success">{success}</div>}
      {error && <div className="profile-error">{error}</div>}

      <div className="profile-card">
        <h1>{user.fullName}</h1>

        {!editing ? (
          <>
            <p>{user.email}</p>

            {user.role === "Freelancer" && (
              <>
                <p>{user.bio}</p>
                <p>{user.skills?.join(", ")}</p>
              </>
            )}

            <button onClick={() => setEditing(true)}>Edit</button>
          </>
        ) : (
          <>
            <textarea value={form.bio} onChange={fc("bio")} />
            <input value={form.skills} onChange={fc("skills")} />
            <button onClick={handleSave}>Save</button>
          </>
        )}
      </div>

      {/* ── Reviews ── */}
      <div style={{ paddingBottom: 40 }}>
        <FreelancerReviews userId={user._id} />
      </div>
    </div>
  );
}