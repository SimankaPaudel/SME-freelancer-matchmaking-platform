/**
 * eSewa Signature Test Script
 * Run this to test signature generation independently
 * 
 * Usage: node testEsewaSignature.js
 */

const crypto = require("crypto");

// âœ… Load environment variables
require("dotenv").config();

const TEST_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const TEST_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


// Test function
function testSignature(total_amount, transaction_uuid, product_code, secret_key) {

  // Construct message - EXACT format required by eSewa
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  

  // Generate signature
  const signature = crypto
    .createHmac("sha256", secret_key)
    .update(message)
    .digest("base64");


  return {
    message,
    signature,
    formData: {
      amount: total_amount,
      tax_amount: "0",
      total_amount: total_amount,
      transaction_uuid: transaction_uuid,
      product_code: product_code,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${FRONTEND_URL}/payment/success`,
      failure_url: `${FRONTEND_URL}/payment/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    }
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEST CASE 1: Standard test amount
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const test1 = testSignature(
  "100",
  "test-uuid-123-456",
  TEST_MERCHANT_CODE,
  TEST_SECRET_KEY
);


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEST CASE 2: Larger amount
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const test2 = testSignature(
  "5000",
  crypto.randomUUID(),
  TEST_MERCHANT_CODE,
  TEST_SECRET_KEY
);


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// COMMON MISTAKES DEMONSTRATION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const wrongMessage1 = `total_amount = 100, transaction_uuid = test-123, product_code = EPAYTEST`;

const wrongMessage2 = `transaction_uuid=test-123,total_amount=100,product_code=EPAYTEST`;

const wrongMessage3 = `total_amount=100,product_code=EPAYTEST`;




// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VERIFY YOUR .ENV FILE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// NEXT STEPS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

