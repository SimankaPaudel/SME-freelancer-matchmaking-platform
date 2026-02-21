const express = require("express");
const router = express.Router();
const escrowCtrl = require("../controllers/EscrowController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Multer setup for work file submissions ─────────────────────────────────
const uploadPath = "uploads/submissions";
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ── IMPORTANT: specific named routes MUST come before /:id param routes ───

// Get all escrows for the logged-in user
router.get("/my-escrows", auth, escrowCtrl.getMyEscrows);

// Get all disputed escrows (Admin only)
router.get("/disputes", auth, escrowCtrl.getDisputes);

// eSewa payment verification (GET = eSewa redirect, POST = frontend call)
router.get("/verify-payment", escrowCtrl.verifyEsewaPayment);
router.post("/verify-payment", escrowCtrl.verifyEsewaPayment);

// Payment failure logging (no auth required — eSewa redirects here)
router.post("/payment-failure", escrowCtrl.logPaymentFailure);

// Test / simulate payment (development only)
router.post("/simulate-payment", auth, escrowCtrl.simulatePayment);

// Test eSewa signature generation (development only)
router.post("/test-signature", auth, escrowCtrl.testEsewaSignature);

// Get escrow by proposal ID
router.get("/proposal/:proposalId", auth, escrowCtrl.getEscrowByProposal);

// ── Debug route (development only) ────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  router.get("/debug-env", (req, res) => {
    res.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSecretKey: !!process.env.ESEWA_SECRET_KEY,
        secretKeyLength: process.env.ESEWA_SECRET_KEY?.length,
        secretKeyPreview: process.env.ESEWA_SECRET_KEY?.substring(0, 5) + "...",
        merchantCode: process.env.ESEWA_MERCHANT_CODE,
        paymentUrl: process.env.ESEWA_PAYMENT_URL,
        verifyUrl: process.env.ESEWA_VERIFY_URL,
        frontendUrl: process.env.FRONTEND_URL,
      },
    });
  });
}

// ── /:id param routes (must come AFTER all named routes) ──────────────────

// Get a single escrow by its _id
router.get("/:id", auth, escrowCtrl.getEscrowByEscrowId);

// Initiate eSewa payment for an escrow
router.post("/:id/initiate-payment", auth, escrowCtrl.initiateEsewaPayment);

// Freelancer submits work (supports optional file upload)
router.post("/:id/submit", auth, upload.single("workFile"), escrowCtrl.submitWork);

// SME approves work → releases payment
router.post("/:id/approve", auth, escrowCtrl.approveWork);

// SME rejects work
router.post("/:id/reject", auth, escrowCtrl.rejectWork);

// Raise a dispute (SME or Freelancer)
router.post("/:id/raise-dispute", auth, escrowCtrl.raiseDispute);

// Admin resolves a dispute
router.post("/:id/resolve-dispute", auth, escrowCtrl.resolveDispute);

module.exports = router;