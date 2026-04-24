const crypto = require("crypto");
const axios = require("axios");

/**
 * : Generate eSewa payment signature with proper encoding
 */
function generateEsewaSignature(total_amount, transaction_uuid, product_code) {
  const secret_key = process.env.ESEWA_SECRET_KEY;

  if (!secret_key) {
    throw new Error(" ESEWA_SECRET_KEY is not configured in environment variables");
  }

  // Ensure values are strings and remove any whitespace
  const amount_str = String(total_amount).trim();
  const uuid_str = String(transaction_uuid).trim();
  const code_str = String(product_code).trim();

  // CRITICAL: Message must match signed_field_names order EXACTLY
  // Format: "total_amount=VALUE,transaction_uuid=VALUE,product_code=VALUE"
  const message = `total_amount=${amount_str},transaction_uuid=${uuid_str},product_code=${code_str}`;


  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", secret_key)
    .update(message)
    .digest("base64");


  return signature;
}

/**
 * FIXED: Create eSewa payment form data with validation
 */
function createEsewaPaymentForm(amount, escrowId) {

  // Validate inputs
  if (!amount || isNaN(amount)) {
    throw new Error("Invalid amount provided");
  }

  // Generate unique transaction UUID
  const transaction_uuid = crypto.randomUUID();
  const product_code = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";

  // Amount must be a whole number STRING
  const total_amount = String(Math.floor(Number(amount)));
  

  // All additional amounts as strings (set to 0)
  const tax_amount = "0";
  const product_service_charge = "0";
  const product_delivery_charge = "0";

  // Generate signature
  const signature = generateEsewaSignature(
    total_amount,
    transaction_uuid,
    product_code
  );

  // âœ… Build URLs
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
  const success_url = `${frontend_url}/payment/success`;
  const failure_url = `${frontend_url}/payment/failure`;


  // âœ… Create payment data object matching eSewa v2 API requirements
  const paymentData = {
    amount: total_amount,
    tax_amount: tax_amount,
    total_amount: total_amount,
    transaction_uuid: transaction_uuid,
    product_code: product_code,
    product_service_charge: product_service_charge,
    product_delivery_charge: product_delivery_charge,
    success_url: success_url,
    failure_url: failure_url,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: signature,
  };


  return paymentData;
}

/**
 * âœ… FIXED: Verify eSewa payment with proper error handling
 */
async function verifyEsewaPayment(transaction_uuid, total_amount, transaction_code) {
  try {
    const verifyUrl = process.env.ESEWA_VERIFY_URL || "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
    const product_code = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";

    // Ensure amount is a string
    const amount_str = String(Math.floor(Number(total_amount)));


    // âœ… Build verification URL with query parameters
    const url = `${verifyUrl}?product_code=${encodeURIComponent(product_code)}&total_amount=${encodeURIComponent(amount_str)}&transaction_uuid=${encodeURIComponent(transaction_uuid)}`;
    

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    });


    const data = response.data;

    // âœ… Verify payment status and match transaction details
    if (
      data.status === "COMPLETE" &&
      data.transaction_uuid === transaction_uuid &&
      String(data.total_amount) === amount_str
    ) {
      
      return {
        success: true,
        data: data,
        message: "Payment verified successfully",
      };
    } else {
      
      return {
        success: false,
        data: data,
        message: "Payment verification failed - data mismatch",
      };
    }
  } catch (error) {
    
    
    return {
      success: false,
      error: error.message,
      message: "Payment verification failed: " + error.message,
    };
  }
}

/**
 * âœ… NEW: Validate callback signature from eSewa
 */
function validateEsewaCallback(callbackData) {

  const required_fields = [
    "transaction_code",
    "status",
    "total_amount",
    "transaction_uuid",
    "product_code",
    "signed_field_names",
    "signature",
  ];

  // Check all required fields
  for (const field of required_fields) {
    if (!callbackData[field]) {
      
      return false;
    }
  }

  // Verify signature matches
  const received_signature = callbackData.signature;
  const calculated_signature = generateEsewaSignature(
    callbackData.total_amount,
    callbackData.transaction_uuid,
    callbackData.product_code
  );

  if (received_signature !== calculated_signature) {
    
    
    
    return false;
  }

  return true;
}

module.exports = {
  generateEsewaSignature,
  createEsewaPaymentForm,
  verifyEsewaPayment,
  validateEsewaCallback,
};
