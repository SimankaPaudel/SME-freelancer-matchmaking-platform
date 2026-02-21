import { useState } from "react";
import "./project.css";

export default function PostProject() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    skills: "",
    experienceLevel: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map(s => s.trim()),
        }),
      });

      // ✅ SAFE PARSE (fixes <!DOCTYPE error)
      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to post project");
      }

      setSuccess("Project posted successfully!");
      setForm({
        title: "",
        description: "",
        skills: "",
        experienceLevel: "",
        budgetMin: "",
        budgetMax: "",
        deadline: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Post Project</h1>

      <form className="project-form" onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="skills" placeholder="Skills (React, Node)" value={form.skills} onChange={handleChange} required />

        <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} required>
          <option value="">Experience Level</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Expert</option>
        </select>

        <input name="budgetMin" type="number" placeholder="Min Budget" value={form.budgetMin} onChange={handleChange} required />
        <input name="budgetMax" type="number" placeholder="Max Budget" value={form.budgetMax} onChange={handleChange} required />
        <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required />

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post Project"}
        </button>

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
      </form>
    </div>
  );
}
