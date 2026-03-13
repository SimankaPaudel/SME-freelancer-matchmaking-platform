import { useEffect, useState } from "react";
import FreelancerReviews from "./FreelancerReviews";

export default function MyReviews() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Try stored user object first, fall back to decoding JWT
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user._id || user.id) {
        setUserId(user._id || user.id);
        return;
      }
    } catch {}

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.userId || payload.id);
      }
    } catch {}
  }, []);

  if (!userId) {
    return (
      <div style={{ padding: "40px 20px", color: "#7a6a55" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 24px", maxWidth: 800 }}>
      <FreelancerReviews userId={userId} />
    </div>
  );
}

