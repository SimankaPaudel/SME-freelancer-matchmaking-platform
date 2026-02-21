import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DisputeList() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/escrows/disputes",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setDisputes(res.data.disputes || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load disputes");
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  if (loading) return <p>Loading disputes...</p>;

  return (
    <div>
      <h2>⚠️ Active Disputes</h2>
      <p>Review and resolve disputes between SMEs and freelancers.</p>

      {error && <p style={{ color: "red" }}>❌ {error}</p>}

      {!disputes.length && !error && (
        <p>✅ No active disputes. Everything looks good!</p>
      )}

      {disputes.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {[
                "Project",
                "Freelancer",
                "SME",
                "Amount",
                "Dispute Reason",
                "Raised On",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>{d.projectId?.title || "N/A"}</td>
                <td style={{ padding: "8px" }}>
                  {d.freelancerId?.fullName}
                  <br />
                  {d.freelancerId?.email}
                </td>
                <td style={{ padding: "8px" }}>
                  {d.smeId?.fullName}
                  <br />
                  {d.smeId?.email}
                </td>
                <td style={{ padding: "8px" }}>₹{d.amount?.toLocaleString()}</td>
                <td style={{ padding: "8px" }}>{d.disputeReason || "—"}</td>
                <td style={{ padding: "8px" }}>
                  {d.updatedAt
                    ? new Date(d.updatedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td style={{ padding: "8px" }}>
                  <button
                    onClick={() =>
                      navigate(`/dashboard/resolve-dispute/${d._id}`)
                    }
                    style={{
                      padding: "8px 16px",
                      background: "#3182ce",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    🛠 Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
