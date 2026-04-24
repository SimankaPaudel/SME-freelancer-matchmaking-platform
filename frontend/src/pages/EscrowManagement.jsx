import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Escrow.css";
import "./EscrowManagement.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function EscrowManagement() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchEscrows();
  }, []);

  const fetchEscrows = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/escrows/my-escrows`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch escrows");

      const data = await res.json();
      setEscrows(Array.isArray(data) ? data : []);
    } catch (err) {
      
      setError("Failed to load escrows");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (escrowId) => {
    if (!confirm("Are you sure you want to deposit funds to this escrow?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/escrows/${escrowId}/initiate-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Payment initiation failed");
      }

      const esewaUrl =
        data.esewaUrl ||
        import.meta.env.VITE_ESEWA_PAYMENT_URL ||
        "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

      sessionStorage.setItem("esewaPaymentData", JSON.stringify(data.paymentData));
      sessionStorage.setItem("esewaUrl", esewaUrl);

      navigate("/payment/esewa", {
        state: {
          formData: data.paymentData,
          esewaUrl: esewaUrl,
        },
      });
    } catch (err) {
      
      alert("âŒ Deposit failed: " + err.message);
    }
  };

  const handleTestPayment = async (escrowId) => {
    if (
      !confirm(
        "[TEST] TEST MODE: Simulate successful eSewa payment?\n\nThis will mark the escrow as funded without going through eSewa sandbox."
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/escrows/simulate-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ escrowId }),
      });

      const data = await res.json();

      if (data.success) {
        alert("âœ… " + data.message);
        fetchEscrows();
      } else {
        alert("âŒ Test payment failed: " + data.message);
      }
    } catch (err) {
      
      alert("âŒ Test payment failed: " + err.message);
    }
  };

  // â”€â”€ Status badge color helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const getStatusStyle = (status) => {
    const map = {
      "Pending Deposit": { background: "#fefcbf", color: "#744210" },
      Funded: { background: "#c6f6d5", color: "#22543d" },
      "In Progress": { background: "#bee3f8", color: "#2a4365" },
      Submitted: { background: "#e9d8fd", color: "#44337a" },
      Released: { background: "#c6f6d5", color: "#22543d" },
      Rejected: { background: "#fed7d7", color: "#742a2a" },
      Disputed: { background: "#feebc8", color: "#7b341e" },
      Refunded: { background: "#e2e8f0", color: "#2d3748" },
    };
    return map[status] || { background: "#e2e8f0", color: "#2d3748" };
  };

  if (loading)
    return (
      <div className="page-container">
        <p>Loading escrows...</p>
      </div>
    );
  if (error)
    return (
      <div className="page-container">
        <p className="error-msg">{error}</p>
      </div>
    );

  return (
    <div className="escrow-management-wrapper">
      <div className="page-container">
      <h1>Escrow Management</h1>
      <p className="subtitle">Manage your project payments and escrow accounts</p>

      {escrows.length === 0 && (
        <p className="no-data">
          No escrows found. Accept a proposal to create an escrow.
        </p>
      )}

      <div className="escrows-grid">
        {escrows.map((escrow) => {
          const statusStyle = getStatusStyle(escrow.status);

          return (
            <div className="escrow-card" key={escrow._id}>
              {/* â”€â”€ Header â”€â”€ */}
              <div className="escrow-header">
                <h3>{escrow.projectId?.title || "Project"}</h3>
                <span
                  className="status-badge"
                  style={{
                    ...statusStyle,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  {escrow.status}
                </span>
              </div>

              {/* â”€â”€ Details â”€â”€ */}
              <div className="escrow-details">
                <div className="detail-row">
                  <span className="label">Amount:</span>
                  <span className="value">â‚¹{escrow.amount?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Freelancer:</span>
                  <span className="value">
                    {escrow.freelancerId?.fullName || "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">SME:</span>
                  <span className="value">{escrow.smeId?.fullName || "N/A"}</span>
                </div>
                {escrow.transactionRef && (
                  <div className="detail-row">
                    <span className="label">Transaction Ref:</span>
                    <span className="value" style={{ fontSize: "12px", wordBreak: "break-all" }}>
                      {escrow.transactionRef}
                    </span>
                  </div>
                )}
                {escrow.rejectionReason && (
                  <div className="detail-row">
                    <span className="label">Rejection Reason:</span>
                    <span className="value" style={{ color: "#c53030" }}>
                      {escrow.rejectionReason}
                    </span>
                  </div>
                )}
                {escrow.disputeReason && (
                  <div className="detail-row">
                    <span className="label">Dispute Reason:</span>
                    <span className="value" style={{ color: "#dd6b20" }}>
                      {escrow.disputeReason}
                    </span>
                  </div>
                )}
              </div>

              {/* â”€â”€ Timeline â”€â”€ */}
              <div className="timeline-section">
                <h4>Timeline</h4>
                <div className="timeline">
                  {escrow.timeline.map((item, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <p className="timeline-action">{item.action}</p>
                        <p className="timeline-date">
                          {new Date(item.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* â”€â”€ Action Buttons â”€â”€ */}
              <div className="escrow-actions">

                {/* 1. SME: Pending Deposit â†’ deposit funds */}
                {escrow.status === "Pending Deposit" && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      className="btn-primary"
                      onClick={() => handleDeposit(escrow._id)}
                    >
                      Deposit via eSewa (â‚¹{escrow.amount})
                    </button>
                    <button
                      className="btn-warning"
                      onClick={() => handleTestPayment(escrow._id)}
                      style={{
                        background: "#ffa500",
                        border: "2px dashed #ff8c00",
                        fontWeight: "bold",
                      }}
                      title="Skip eSewa sandbox and simulate successful payment"
                    >
                      Test Mode (Skip eSewa)
                    </button>
                  </div>
                )}

                {/* 2. SME: Funded / In Progress â†’ can raise dispute */}
                {["Funded", "In Progress"].includes(escrow.status) && (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ color: "#2b6cb0" }}>
                      â³ Waiting for freelancer to submit work...
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/raise-dispute/${escrow._id}`)
                      }
                      style={{
                        padding: "8px 14px",
                        background: "#dd6b20",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Raise Dispute
                    </button>
                  </div>
                )}

                {/* 3. âœ… SME: Submitted â†’ REVIEW WORK */}
                {escrow.status === "Submitted" && (
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/review-work/${escrow._id}`)
                      }
                      style={{
                        padding: "10px 20px",
                        background: "#2f855a",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "15px",
                      }}
                    >
                      Review Submitted Work
                    </button>
                    <span
                      style={{
                        color: "#d97706",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      â³ Awaiting your review
                    </span>
                  </div>
                )}

                {/* 4. SME: Rejected â†’ awaiting resubmission or dispute */}
                {escrow.status === "Rejected" && (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#c53030", fontSize: "13px" }}>
                      âŒ Work rejected â€” awaiting freelancer resubmission
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/dashboard/raise-dispute/${escrow._id}`)
                      }
                      style={{
                        padding: "8px 14px",
                        background: "#dd6b20",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      Raise Dispute Instead
                    </button>
                  </div>
                )}

                {/* 5. Released */}
                {escrow.status === "Released" && (
                  <p
                    style={{
                      color: "#2f855a",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    âœ… Payment released to freelancer
                  </p>
                )}

                {/* 6. Disputed */}
                {escrow.status === "Disputed" && (
                  <p
                    style={{
                      color: "#dd6b20",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    âš ï¸ Dispute raised â€” awaiting admin resolution
                  </p>
                )}

                {/* 7. Refunded */}
                {escrow.status === "Refunded" && (
                  <p
                    style={{
                      color: "#718096",
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    Refund of â‚¹{escrow.refundAmount?.toLocaleString()} processed
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

