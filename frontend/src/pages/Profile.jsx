import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUser(data.user);
    };

    fetchProfile();
  }, [navigate]);

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-card">
      <div className="profile-header">
        <h1>{user.fullName}</h1>
        <span className={`role-badge ${user.role.toLowerCase()}`}>
          {user.role}
        </span>
      </div>
      <div className="profile-details">
        <div className="profile-field">
          <label>Email</label>
          <p>{user.email}</p>
        </div>
        <div className="profile-field">
          <label>Role</label>
          <p>{user.role}</p>
        </div>
      </div>
    </div>
  );
}
