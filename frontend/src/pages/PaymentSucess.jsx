import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Payment.css";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("Verifying your payment...");
  const [showTestModeOption, setShowTestModeOption] = useState(false);
  const [transactionUuid, setTransactionUuid] = useState(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      // Extract payment data from URL parameters
      const paymentData = {
        transaction_uuid: searchParams.get("transaction_uuid"),
        transaction_code: searchParams.get("transaction_code"),
        total_amount: searchParams.get("total_amount"),
        product_code: searchParams.get("product_code"),
        status: searchParams.get("status"),
        signature: searchParams.get("signature"),
        signed_field_names: searchParams.get("signed_field_names")
      };

      console.log("🔍 Payment Success Page Loaded");
      console.log("Payment data from URL:", paymentData);
      console.log("Full URL:", window.location.href);

      // ✅ Check if we have transaction_uuid at minimum
      if (!paymentData.transaction_uuid) {
        console.warn("⚠️ No transaction_uuid in URL");
        setSuccess(false);
        setMessage("Payment data not found. eSewa may not have redirected properly.");
        setVerifying(false);
        setShowTestModeOption(true);
        return;
      }

      setTransactionUuid(paymentData.transaction_uuid);

      // ✅ Check if we have transaction_code (required for verification)
      if (!paymentData.transaction_code) {
        console.warn("⚠️ No transaction_code in URL - eSewa sandbox limitation");
        setSuccess(false);
        setMessage("eSewa callback incomplete. Transaction code not provided by payment gateway.");
        setVerifying(false);
        setShowTestModeOption(true);
        return;
      }

      console.log("✅ Payment data complete, verifying with backend...");

      // ✅ Call backend verification
      const res = await fetch("http://localhost:5000/api/escrows/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      console.log("Backend response status:", res.status);

      const data = await res.json();
      console.log("Backend response data:", data);

      if (data.success) {
        console.log("✅ Payment verified successfully");
        setSuccess(true);
        setMessage("Payment verified successfully! Your escrow has been funded.");
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/dashboard/escrow-management");
        }, 3000);
      } else {
        console.log("❌ Verification failed:", data.message);
        setSuccess(false);
        setMessage(data.message || "Payment verification failed.");
        
        // Show test mode option if it's a callback issue
        if (data.issue && data.issue.includes("callback")) {
          setShowTestModeOption(true);
        }
      }
    } catch (err) {
      console.error("❌ Payment verification error:", err);
      setSuccess(false);
      setMessage("Failed to verify payment. Please contact support.");
      setShowTestModeOption(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleUseTestMode = () => {
    navigate("/dashboard/escrow-management", {
      state: { showTestModeHint: true }
    });
  };

  return (
    <div className="payment-result-container">
      <div className={`payment-result-card ${success ? 'success' : verifying ? '' : 'warning'}`}>
        {verifying ? (
          <>
            <div className="loading-spinner"></div>
            <h2>Verifying Payment...</h2>
            <p>Please wait while we confirm your payment with eSewa.</p>
            {transactionUuid && (
              <div className="payment-details" style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  <strong>Transaction ID:</strong> {transactionUuid}
                </p>
              </div>
            )}
          </>
        ) : success ? (
          <>
            <div className="success-icon">✅</div>
            <h2>Payment Successful!</h2>
            <p>{message}</p>
            <div className="payment-details">
              <p><strong>Transaction ID:</strong> {searchParams.get("transaction_uuid")}</p>
              <p><strong>Amount:</strong> ₹{searchParams.get("total_amount")}</p>
              {searchParams.get("transaction_code") && (
                <p><strong>eSewa Ref:</strong> {searchParams.get("transaction_code")}</p>
              )}
            </div>
            <p className="redirect-text">Redirecting to dashboard in 3 seconds...</p>
            <button 
              className="btn-primary"
              onClick={() => navigate("/dashboard/escrow-management")}
            >
              Go to Escrow Management
            </button>
          </>
        ) : (
          <>
            <div className="warning-icon">⚠️</div>
            <h2>Payment Verification Issue</h2>
            <p>{message}</p>
            
            {showTestModeOption && (
              <>
                <div className="info-box" style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  background: '#fff3cd', 
                  borderRadius: '8px',
                  border: '1px solid #ffc107'
                }}>
                  <p><strong>What happened?</strong></p>
                  <p>eSewa's sandbox environment sometimes fails to send complete payment confirmation data. This is a known limitation of the test environment.</p>
                  
                  <p style={{ marginTop: '15px' }}><strong>Your Options:</strong></p>
                  <ol style={{ textAlign: 'left', paddingLeft: '20px' }}>
                    <li><strong>Try Again:</strong> Return to escrow management and attempt the payment again</li>
                    <li><strong>Use Test Mode:</strong> For development, use the test mode button to simulate payment completion</li>
                    <li><strong>Contact Support:</strong> If this persists in production, contact our support team</li>
                  </ol>
                </div>

                {transactionUuid && (
                  <div className="payment-details" style={{ marginTop: '20px' }}>
                    <p><strong>Transaction ID:</strong> {transactionUuid}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                      Save this ID for reference if you need support
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="action-buttons" style={{ 
              marginTop: '20px', 
              display: 'flex', 
              gap: '10px', 
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <button 
                className="btn-primary"
                onClick={handleUseTestMode}
              >
                Back to Escrow Management
              </button>
              {import.meta.env.DEV && showTestModeOption && (
                <button 
                  className="btn-warning"
                  onClick={handleUseTestMode}
                  style={{
                    background: '#ffa500',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Use Test Mode Instead
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

