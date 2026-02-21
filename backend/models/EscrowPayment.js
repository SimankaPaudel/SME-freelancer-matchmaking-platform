const mongoose = require("mongoose");

const escrowSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
      unique: true,
    },

    smeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending Deposit",
        "Funded",
        "In Progress",
        "Submitted",
        "Released",
        "Rejected",
        "Disputed",
        "Refunded",
      ],
      default: "Pending Deposit",
    },

    // Internal transaction reference (UUID)
    transactionRef: String,

    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ["Pending", "Verified", "Released", "Failed"],
      default: "Pending",
    },

    esewaTransactionCode: String,
    paymentVerifiedAt: Date,

    // Work submission
    submittedFile: String,       // path to uploaded file
    submissionComment: String,
    submittedAt: Date,

    // Approval / release
    approvedAt: Date,
    releasedAt: Date,
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Rejection
    rejectionReason: String,

    // Dispute handling
    disputeReason: String,
    disputeResolvedAt: Date,
    // ✅ FIXED: plain String (no enum) so we can store descriptive resolution text
    disputeResolution: { type: String },
    refundAmount: Number,
    refundedAt: Date,

    // Reminder system
    reminderSent: {
      type: Boolean,
      default: false,
    },

    // Timeline / Audit trail
    timeline: [
      {
        action: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Escrow", escrowSchema);