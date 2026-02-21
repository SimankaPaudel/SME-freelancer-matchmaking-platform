import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Payment.css";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Log the failure
    logPaymentFailure();
  }, []);

  const logPaymentFailure = async () => {
    try {
      const transaction_uuid = searchParams.get("transaction_uuid");
      
      if (transaction_uuid) {
        await fetch("http://localhost:5000/api/escrows/payment-failure", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transaction_uuid }),
        });
      }
    } catch (err) {
      console.error("Failed to log payment failure:", err);
    }
  };

  return (
    <div className="payment-result-container">
      <div className="payment-result-card error">
        <div className="error-icon">❌</div>
        <h2>Payment Cancelled</h2>
        <p>Your payment was not completed. The escrow has not been funded.</p>
        
        <div className="info-box">
          <p><strong>What happened?</strong></p>
          <ul>
            <li>You may have cancelled the payment</li>
            <li>The payment may have timed out</li>
            <li>There may have been an issue with eSewa</li>
          </ul>
        </div>

        <div className="info-box">
          <p><strong>What can you do?</strong></p>
          <ul>
            <li>Try the payment again from Escrow Management</li>
            <li>Check your eSewa account balance</li>
            <li>Contact support if you continue to have issues</li>
          </ul>
        </div>

        {searchParams.get("transaction_uuid") && (
          <div className="payment-details">
            <p><strong>Transaction ID:</strong> {searchParams.get("transaction_uuid")}</p>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate("/dashboard/escrow-management")}
          >
            Back to Escrow Management
          </button>
          <button 
            className="btn-secondary"
            onClick={() => window.location.href = "mailto:support@yourplatform.com"}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

