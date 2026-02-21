import { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function EsewaPaymentForm() {
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useLocation();
  const [status, setStatus] = useState("loading");
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    console.log("🔄 EsewaPaymentForm mounted");
    
    let formData = state?.formData;
    let esewaUrl = state?.esewaUrl;

    // Fallback to sessionStorage
    if (!formData || !esewaUrl) {
      const storedData = sessionStorage.getItem("esewaPaymentData");
      const storedUrl = sessionStorage.getItem("esewaUrl");
      
      if (storedData) {
        try {
          formData = JSON.parse(storedData);
          esewaUrl = storedUrl;
        } catch (e) {
          console.error("❌ Parse error:", e);
        }
      }
    }

    // Validate data
    if (!formData || !esewaUrl) {
      console.error("❌ Missing payment data");
      setStatus("error");
      setTimeout(() => {
        alert("Payment data missing. Please try again.");
        navigate("/dashboard/escrow-management", { replace: true });
      }, 1000);
      return;
    }

    // ✅ Store debug info
    setDebugInfo({
      url: esewaUrl,
      fields: Object.keys(formData).length,
      amount: formData.total_amount,
      signature: formData.signature,
      signatureLength: formData.signature?.length
    });

    console.log("\n" + "=".repeat(60));
    console.log("🚀 SUBMITTING TO ESEWA");
    console.log("=".repeat(60));
    console.log("URL:", esewaUrl);
    console.log("\nForm Data:");
    Object.entries(formData).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}"`);
    });
    console.log("\nSignature Analysis:");
    console.log("  Length:", formData.signature?.length);
    console.log("  First 20 chars:", formData.signature?.substring(0, 20));
    console.log("  Last 20 chars:", formData.signature?.substring(formData.signature?.length - 20));
    console.log("=".repeat(60) + "\n");
    
    setStatus("submitting");

    // Submit form after render
    setTimeout(() => {
      if (formRef.current) {
        console.log("✅ Submitting form...");
        formRef.current.submit();
        
        // Clear storage after submit
        setTimeout(() => {
          sessionStorage.removeItem("esewaPaymentData");
          sessionStorage.removeItem("esewaUrl");
        }, 500);
      }
    }, 100);
  }, [state, navigate]);

  if (status === "loading") {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner"></div>
        <p>Preparing payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p>❌ Payment data missing. Redirecting...</p>
      </div>
    );
  }

  const formData = state?.formData || JSON.parse(sessionStorage.getItem("esewaPaymentData") || "{}");
  const esewaUrl = state?.esewaUrl || sessionStorage.getItem("esewaUrl") || "";

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem'
    }}>
      <div className="loading-spinner"></div>
      <p>Redirecting to eSewa payment gateway...</p>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Amount: ₹{formData.total_amount}
      </p>
      
      {/* Debug info in development */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          fontSize: '0.8rem',
          maxWidth: '600px'
        }}>
          <strong>Debug Info:</strong>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      
      <form
        ref={formRef}
        action={esewaUrl}
        method="POST"
        style={{ display: "none" }}
      >
        {Object.entries(formData).map(([key, value]) => (
          <input 
            key={key} 
            type="hidden" 
            name={key} 
            value={value}
          />
        ))}
      </form>
    </div>
  );
}