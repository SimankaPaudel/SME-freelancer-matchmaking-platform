/**
 * eSewa Signature Test Script
 * Run this to test signature generation independently
 * 
 * Usage: node testEsewaSignature.js
 */

const crypto = require("crypto");

// ✅ EXACT values from eSewa test documentation
const TEST_SECRET_KEY = "8gBm/:&EnhH.1/q";
const TEST_MERCHANT_CODE = "EPAYTEST";

console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║         eSewa SIGNATURE GENERATION TEST                  ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

// Test function
function testSignature(total_amount, transaction_uuid, product_code, secret_key) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 TEST INPUTS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total Amount: "${total_amount}" (type: ${typeof total_amount})`);
  console.log(`Transaction UUID: "${transaction_uuid}"`);
  console.log(`Product Code: "${product_code}"`);
  console.log(`Secret Key: "${secret_key}"`);
  console.log();

  // Construct message - EXACT format required by eSewa
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 SIGNATURE GENERATION:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Message: "${message}"`);
  console.log(`Message Length: ${message.length} characters`);
  console.log(`Message Bytes: ${Buffer.from(message).length} bytes`);
  console.log();

  // Generate signature
  const signature = crypto
    .createHmac("sha256", secret_key)
    .update(message)
    .digest("base64");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ RESULT:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Signature: ${signature}`);
  console.log(`Signature Length: ${signature.length} characters`);
  console.log();

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
      success_url: "http://localhost:5173/payment/success",
      failure_url: "http://localhost:5173/payment/failure",
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: signature,
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// TEST CASE 1: Standard test amount
// ═══════════════════════════════════════════════════════════════
console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║ TEST CASE 1: Amount = 100                                ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

const test1 = testSignature(
  "100",
  "test-uuid-123-456",
  TEST_MERCHANT_CODE,
  TEST_SECRET_KEY
);

console.log("📦 Form Data (JSON):");
console.log(JSON.stringify(test1.formData, null, 2));
console.log("\n");

// ═══════════════════════════════════════════════════════════════
// TEST CASE 2: Larger amount
// ═══════════════════════════════════════════════════════════════
console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║ TEST CASE 2: Amount = 5000                               ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

const test2 = testSignature(
  "5000",
  crypto.randomUUID(),
  TEST_MERCHANT_CODE,
  TEST_SECRET_KEY
);

console.log("📦 Form Data (JSON):");
console.log(JSON.stringify(test2.formData, null, 2));
console.log("\n");

// ═══════════════════════════════════════════════════════════════
// COMMON MISTAKES DEMONSTRATION
// ═══════════════════════════════════════════════════════════════
console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║ ⚠️  COMMON MISTAKES TO AVOID                              ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

console.log("❌ WRONG: Extra spaces in message");
const wrongMessage1 = `total_amount = 100, transaction_uuid = test-123, product_code = EPAYTEST`;
console.log(`   Message: "${wrongMessage1}"`);
console.log();

console.log("❌ WRONG: Different field order");
const wrongMessage2 = `transaction_uuid=test-123,total_amount=100,product_code=EPAYTEST`;
console.log(`   Message: "${wrongMessage2}"`);
console.log();

console.log("❌ WRONG: Missing field");
const wrongMessage3 = `total_amount=100,product_code=EPAYTEST`;
console.log(`   Message: "${wrongMessage3}"`);
console.log();

console.log("❌ WRONG: Using number instead of string");
console.log(`   total_amount: 100 (number) ← should be "100" (string)`);
console.log();

console.log("❌ WRONG: Decimal amounts in test environment");
console.log(`   total_amount: "100.50" ← should be "100" or "101"`);
console.log();

console.log("✅ CORRECT: Exact format");
console.log(`   Message: "total_amount=100,transaction_uuid=test-123,product_code=EPAYTEST"`);
console.log();

// ═══════════════════════════════════════════════════════════════
// VERIFY YOUR .ENV FILE
// ═══════════════════════════════════════════════════════════════
console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║ 🔍 VERIFY YOUR .ENV FILE                                  ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

console.log("Your .env file should have EXACTLY these values:\n");
console.log("ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q");
console.log("ESEWA_MERCHANT_CODE=EPAYTEST");
console.log("ESEWA_PAYMENT_URL=https://rc-epay.esewa.com.np/api/epay/main/v2/form");
console.log("ESEWA_VERIFY_URL=https://rc-epay.esewa.com.np/api/epay/transaction/status");
console.log("FRONTEND_URL=http://localhost:5173");
console.log();
console.log("⚠️  Important:");
console.log("   - No quotes around values");
console.log("   - No spaces before/after = sign");
console.log("   - Secret key includes special characters /:&");
console.log("   - FRONTEND_URL must match your actual dev server port");
console.log();

// ═══════════════════════════════════════════════════════════════
// NEXT STEPS
// ═══════════════════════════════════════════════════════════════
console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║ 📋 NEXT STEPS                                             ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

console.log("1. Copy one of the test form data objects above");
console.log("2. Try submitting it manually to eSewa:");
console.log("   https://rc-epay.esewa.com.np/api/epay/main/v2/form");
console.log();
console.log("3. If it works → Your signature generation is correct!");
console.log("   If ES104 → Check your .env secret key is EXACTLY: 8gBm/:&EnhH.1/q");
console.log();
console.log("4. Once manual test works, update your backend code");
console.log("5. Restart your server (important for .env changes)");
console.log();
console.log("═══════════════════════════════════════════════════════════\n");