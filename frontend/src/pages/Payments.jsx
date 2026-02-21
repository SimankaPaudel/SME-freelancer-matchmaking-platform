import { useEffect, useState } from "react";
import axios from "axios";
import "./Payment.css";

export default function Payments() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEscrows = async () => {
      try {
        // ✅ FIXED: use /my-escrows — backend figures out role from JWT
        const { data } = await axios.get("http://localhost:5000/api/escrows/my-escrows", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        setEscrows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch escrows:", err);
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };

    fetchEscrows();
  }, []);

  if (loading) return <p>Loading payments...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!escrows.length)
    return (
      <div className="payments-container">
        <h2>Payments / Escrow Timeline</h2>
        <p style={{ color: "#718096" }}>
          No payments found yet. Payments will appear here once an escrow is created for your project.
        </p>
      </div>
    );

  return (
    <div className="payments-container">
      <h2>Payments / Escrow Timeline</h2>
      {escrows.map((escrow) => (
        <div key={escrow._id} className="escrow-card">
          <h3>
            {escrow.projectId?.title || "Project"} | Amount: ₹
            {escrow.amount?.toLocaleString()}
          </h3>
          <p>
            <strong>Status:</strong> {escrow.status}
          </p>
          <p>
            <strong>Freelancer:</strong> {escrow.freelancerId?.fullName || "N/A"}
          </p>
          <p>
            <strong>SME:</strong> {escrow.smeId?.fullName || "N/A"}
          </p>
          {escrow.paymentVerifiedAt && (
            <p>
              <strong>Payment Verified:</strong>{" "}
              {new Date(escrow.paymentVerifiedAt).toLocaleString()}
            </p>
          )}
          {escrow.releasedAt && (
            <p>
              <strong>Payment Released:</strong>{" "}
              {new Date(escrow.releasedAt).toLocaleString()}
            </p>
          )}
          <div className="timeline">
            {escrow.timeline.map((item, index) => (
              <div key={index} className="timeline-item">
                <span className="timeline-action">{item.action}</span>
                <span className="timeline-date">
                  {item.date ? new Date(item.date).toLocaleString() : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

