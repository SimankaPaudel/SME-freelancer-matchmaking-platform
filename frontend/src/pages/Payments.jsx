import { useEffect, useState } from "react";
import axios from "axios";
import "./Payment.css";

const ITEMS_PER_PAGE = 5;

export default function Payments() {
  const [escrows, setEscrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchEscrows = async () => {
      try {
        // FIXED: use /my-escrows — backend figures out role from JWT
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

  // Pagination logic
  const totalPages = Math.ceil(escrows.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEscrows = escrows.slice(startIndex, endIndex);

  if (loading) return <p className="loading-text">Loading payments...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!escrows.length)
    return (
      <div className="payments-container">
        <h2>Payments / Escrow Timeline</h2>
        <div className="empty-state">
          <p>
            No payments found yet. Payments will appear here once an escrow is created for your project.
          </p>
        </div>
      </div>
    );

  return (
    <div className="payments-container">
      <div className="payments-header">
        <h2>Payments / Escrow Timeline</h2>
        <p className="payments-subtitle">Total Transactions: {escrows.length}</p>
      </div>
      
      <div className="escrow-cards-wrapper">
        {paginatedEscrows.map((escrow) => (
          <div key={escrow._id} className="escrow-card-enhanced">
            <div className="card-status">
              <h3>{escrow.projectId?.title || "Project"}</h3>
              <span className={`status-badge-payment ${escrow.status.toLowerCase()}`}>
                {escrow.status}
              </span>
            </div>

            <div className="card-amount">
              <span className="amount-label">Amount</span>
              <span className="amount-value">₹{escrow.amount?.toLocaleString()}</span>
            </div>

            <div className="card-details">
              <div className="detail-row">
                <span className="detail-label">Freelancer:</span>
                <span className="detail-value">{escrow.freelancerId?.fullName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">SME:</span>
                <span className="detail-value">{escrow.smeId?.fullName || "N/A"}</span>
              </div>
            </div>

            {escrow.paymentVerifiedAt && (
              <div className="verified-badge">
                <span>✓ Payment Verified:</span>
                <span>{new Date(escrow.paymentVerifiedAt).toLocaleDateString()}</span>
              </div>
            )}

            {escrow.releasedAt && (
              <div className="released-badge">
                <span>✓ Payment Released:</span>
                <span>{new Date(escrow.releasedAt).toLocaleDateString()}</span>
              </div>
            )}

            <div className="timeline">
              {escrow.timeline.slice(0, 3).map((item, index) => (
                <div key={index} className="timeline-item-compact">
                  <span className="timeline-action">{item.action}</span>
                  <span className="timeline-date">
                    {item.date ? new Date(item.date).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>

          <div className="pagination-info">
            Page <span className="current-page">{currentPage}</span> of{" "}
            <span className="total-pages">{totalPages}</span>
          </div>

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

