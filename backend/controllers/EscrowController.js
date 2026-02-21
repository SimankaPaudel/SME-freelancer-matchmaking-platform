const Escrow = require("../models/EscrowPayment");
const Project = require("../models/Project");
const { createEsewaPaymentForm, verifyEsewaPayment } = require("../utils/esewaHelper");
const { createNotification } = require("../utils/notificationHelper");

exports.getEscrowByProposal = async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ proposalId: req.params.proposalId })
      .populate("projectId", "title budgetMin budgetMax")
      .populate("freelancerId", "fullName email")
      .populate("smeId", "fullName email");

    if (!escrow) {
      return res.status(200).json({ escrow: null, message: "Escrow not created yet." });
    }

    const userId = req.user.userId;
    if (escrow.smeId._id.toString() !== userId && escrow.freelancerId._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(escrow);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch escrow" });
  }
};

exports.getEscrowByEscrowId = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title budgetMin budgetMax deadline")
      .populate("freelancerId", "fullName email")
      .populate("smeId", "fullName email");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });

    const userId = req.user.userId;
    if (
      escrow.smeId._id.toString() !== userId &&
      escrow.freelancerId._id.toString() !== userId &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(escrow);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch escrow" });
  }
};

exports.getMyEscrows = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    let query = {};
    if (userRole === "SME") query.smeId = userId;
    else if (userRole === "Freelancer") query.freelancerId = userId;
    else return res.status(403).json({ message: "Unauthorized role" });

    const escrows = await Escrow.find(query)
      .populate("projectId", "title budgetMin budgetMax")
      .populate("freelancerId", "fullName email")
      .populate("smeId", "fullName email")
      .sort({ createdAt: -1 });

    res.json(escrows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch escrows" });
  }
};

exports.initiateEsewaPayment = async (req, res) => {
  try {
    const requiredEnvVars = ["ESEWA_SECRET_KEY", "ESEWA_MERCHANT_CODE", "ESEWA_PAYMENT_URL", "FRONTEND_URL"];
    const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
    if (missingVars.length > 0) {
      return res.status(500).json({ success: false, message: "Server configuration error.", missingConfig: missingVars });
    }

    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title")
      .populate("freelancerId", "_id");

    if (!escrow) return res.status(404).json({ success: false, message: "Escrow not found" });
    if (escrow.smeId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Only SME can initiate payment" });
    }
    if (!escrow.amount || escrow.amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid escrow amount" });
    }

    const paymentData = createEsewaPaymentForm(escrow.amount, escrow._id);
    escrow.transactionRef = paymentData.transaction_uuid;
    escrow.paymentStatus = "Pending";
    escrow.timeline.push({ action: `Payment initiated via eSewa (Amount: ₹${escrow.amount})` });
    await escrow.save();

    res.json({ success: true, paymentData, esewaUrl: process.env.ESEWA_PAYMENT_URL });
  } catch (err) {
    res.status(500).json({ success: false, message: "Payment initiation failed: " + err.message });
  }
};

exports.verifyEsewaPayment = async (req, res) => {
  try {
    const paymentData = req.method === "POST" ? req.body : req.query;
    const { transaction_uuid, transaction_code, total_amount } = paymentData;

    if (!transaction_uuid) {
      return res.status(400).json({ success: false, message: "Missing transaction UUID." });
    }

    const escrow = await Escrow.findOne({ transactionRef: transaction_uuid })
      .populate("projectId", "title")
      .populate("freelancerId", "_id fullName");

    if (!escrow) return res.status(404).json({ success: false, message: "Transaction not found.", transaction_uuid });

    if (escrow.paymentStatus === "Verified") {
      return res.json({ success: true, message: "Payment already verified", escrow, alreadyVerified: true });
    }

    if (!transaction_code) {
      escrow.timeline.push({ action: "Payment callback incomplete - verification pending" });
      await escrow.save();
      return res.status(400).json({
        success: false,
        message: "Payment callback incomplete.",
        issue: "eSewa sandbox did not provide transaction_code",
        escrowId: escrow._id,
        transaction_uuid,
      });
    }

    const verification = await verifyEsewaPayment(transaction_uuid, total_amount || escrow.amount, transaction_code);

    if (verification.success) {
      escrow.status = "Funded";
      escrow.paymentStatus = "Verified";
      escrow.esewaTransactionCode = transaction_code;
      escrow.paymentVerifiedAt = new Date();
      escrow.timeline.push({ action: `Payment verified - Escrow funded (₹${escrow.amount})` });
      await escrow.save();

      await Project.findByIdAndUpdate(escrow.projectId, { status: "In Progress" });

      // ✅ Notify freelancer
      await createNotification({
        userId: escrow.freelancerId._id,
        title: "Escrow Funded — Start Working!",
        message: `₹${escrow.amount} has been deposited into escrow for "${escrow.projectId?.title}". You can now submit your work.`,
        type: "escrow_funded",
        link: "/dashboard/my-proposals",
      });

      res.json({ success: true, message: "Payment verified! Escrow funded.", escrow });
    } else {
      escrow.paymentStatus = "Failed";
      escrow.timeline.push({ action: `Payment verification failed: ${verification.message}` });
      await escrow.save();
      res.status(400).json({ success: false, message: verification.message || "Payment verification failed" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Payment verification failed: " + err.message });
  }
};

exports.logPaymentFailure = async (req, res) => {
  try {
    const { transaction_uuid } = req.body;
    if (!transaction_uuid) return res.status(400).json({ success: false, message: "Transaction UUID required" });

    const escrow = await Escrow.findOne({ transactionRef: transaction_uuid });
    if (escrow) {
      escrow.paymentStatus = "Failed";
      escrow.timeline.push({ action: "Payment cancelled or failed by user" });
      await escrow.save();
    }

    res.json({ success: true, message: "Payment failure logged" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to log payment failure" });
  }
};

exports.submitWork = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title")
      .populate("smeId", "_id fullName");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });

    if (escrow.freelancerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only freelancer can submit work" });
    }

    const allowedStatuses = ["Funded", "In Progress"];
    if (!allowedStatuses.includes(escrow.status)) {
      return res.status(400).json({ message: `Cannot submit work. Current status: ${escrow.status}.` });
    }

    if (req.file) escrow.submittedFile = req.file.path;
    if (req.body.comment) escrow.submissionComment = req.body.comment;

    escrow.status = "Submitted";
    escrow.submittedAt = new Date();
    escrow.timeline.push({ action: "Work Submitted by Freelancer" });
    await escrow.save();

    await Project.findByIdAndUpdate(escrow.projectId, { status: "Review" });

    // ✅ Notify SME
    await createNotification({
      userId: escrow.smeId._id,
      title: "📦 Work Submitted — Review Required",
      message: `A freelancer has submitted work for "${escrow.projectId?.title}". Please review and approve or reject.`,
      type: "work_submitted",
      link: `/dashboard/review-work/${escrow._id}`,
    });

    res.json({ success: true, message: "Work submitted successfully", escrow });
  } catch (err) {
    res.status(500).json({ message: "Submit failed" });
  }
};

exports.approveWork = async (req, res) => {
  try {
    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title")
      .populate("freelancerId", "_id fullName");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });
    if (req.user.role !== "SME") return res.status(403).json({ message: "Only SME can approve work" });
    if (escrow.status !== "Submitted") {
      return res.status(400).json({ message: `Cannot approve. Current status: ${escrow.status}` });
    }

    escrow.status = "Released";
    escrow.paymentStatus = "Released";
    escrow.approvedAt = new Date();
    escrow.releasedAt = new Date();
    escrow.releasedBy = req.user.userId;
    escrow.timeline.push(
      { action: "Work Approved by SME", by: req.user.userId },
      { action: `Payment of ₹${escrow.amount} Released to Freelancer`, by: req.user.userId }
    );
    await escrow.save();

    await Project.findByIdAndUpdate(escrow.projectId, { status: "Completed" });

    // ✅ Notify freelancer
    await createNotification({
      userId: escrow.freelancerId._id,
      title: "🎉 Payment Released!",
      message: `Your work on "${escrow.projectId?.title}" was approved! ₹${escrow.amount} has been released to you.`,
      type: "payment_released",
      link: "/dashboard/my-proposals",
    });

    res.json({ success: true, message: "Work approved and payment released!", escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectWork = async (req, res) => {
  try {
    const { reason } = req.body;

    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title")
      .populate("freelancerId", "_id fullName");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });
    if (req.user.role !== "SME") return res.status(403).json({ message: "Only SME can reject work" });
    if (escrow.status !== "Submitted") {
      return res.status(400).json({ message: `Cannot reject. Current status: ${escrow.status}` });
    }

    escrow.status = "Rejected";
    escrow.rejectionReason = reason || "No reason provided";
    escrow.timeline.push({ action: `Work Rejected. Reason: ${reason || "No reason provided"}`, by: req.user.userId });
    await escrow.save();

    // ✅ Notify freelancer
    await createNotification({
      userId: escrow.freelancerId._id,
      title: "Work Rejected",
      message: `Your submission for "${escrow.projectId?.title}" was rejected. Reason: ${reason || "No reason provided"}. You can resubmit or raise a dispute.`,
      type: "work_rejected",
      link: "/dashboard/my-proposals",
    });

    res.json({ success: true, message: "Work rejected.", escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.raiseDispute = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: "Dispute reason is required" });

    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title")
      .populate("smeId", "_id fullName")
      .populate("freelancerId", "_id fullName");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });

    const userId = req.user.userId;
    if (escrow.smeId._id.toString() !== userId && escrow.freelancerId._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const allowedStatuses = ["Submitted", "Rejected", "Funded", "In Progress"];
    if (!allowedStatuses.includes(escrow.status)) {
      return res.status(400).json({ message: `Cannot raise dispute. Current status: ${escrow.status}` });
    }

    escrow.disputeReason = reason;
    escrow.status = "Disputed";
    escrow.timeline.push({ action: `Dispute raised by ${req.user.role}: ${reason}`, by: userId });
    await escrow.save();

    // ✅ Notify the other party
    const raisedByFreelancer = escrow.freelancerId._id.toString() === userId;
    const notifyUserId = raisedByFreelancer ? escrow.smeId._id : escrow.freelancerId._id;
    const raisedByRole = raisedByFreelancer ? "Freelancer" : "SME";

    await createNotification({
      userId: notifyUserId,
      title: "⚠️ Dispute Raised",
      message: `A dispute was raised by the ${raisedByRole} for "${escrow.projectId?.title}". An admin will review and resolve it soon.`,
      type: "dispute_raised",
      link: "/dashboard/escrow-management",
    });

    res.json({ success: true, message: "Dispute raised successfully", escrow });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDisputes = async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Only admins can view disputes" });

    const disputes = await Escrow.find({ status: "Disputed" })
      .populate("projectId", "title")
      .populate("freelancerId", "fullName email")
      .populate("smeId", "fullName email");

    res.json({ success: true, disputes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, refundPercentage, reason } = req.body;

    if (req.user.role !== "Admin") return res.status(403).json({ message: "Only admins can resolve disputes" });

    const escrow = await Escrow.findById(req.params.id)
      .populate("projectId", "title")
      .populate("smeId", "_id fullName")
      .populate("freelancerId", "_id fullName");

    if (!escrow) return res.status(404).json({ message: "Escrow not found" });
    if (escrow.status !== "Disputed") return res.status(400).json({ message: "Escrow is not in dispute" });

    let notifyMessage = "";

    if (resolution === "refund") {
      const pct = parseFloat(refundPercentage) || 100;
      const refundAmt = escrow.amount * (pct / 100);

      escrow.status = "Refunded";
      escrow.refundAmount = refundAmt;
      escrow.refundedAt = new Date();
      escrow.disputeResolution = `Refunded ${pct}% (₹${refundAmt}) to SME. Reason: ${reason}`;
      escrow.timeline.push({ action: `Dispute resolved: Refund of ₹${refundAmt} to SME` });
      await Project.findByIdAndUpdate(escrow.projectId, { status: "Cancelled" });

      notifyMessage = `Dispute resolved. ₹${refundAmt} (${pct}%) refunded to SME. Reason: ${reason}`;
    } else if (resolution === "release") {
      escrow.status = "Released";
      escrow.paymentStatus = "Released";
      escrow.releasedAt = new Date();
      escrow.disputeResolution = `Payment released to freelancer. Reason: ${reason}`;
      escrow.timeline.push({ action: "Dispute resolved: Payment released to freelancer" });
      await Project.findByIdAndUpdate(escrow.projectId, { status: "Completed" });

      notifyMessage = `Dispute resolved. ₹${escrow.amount} released to freelancer. Reason: ${reason}`;
    } else {
      return res.status(400).json({ message: "Invalid resolution type. Use 'refund' or 'release'." });
    }

    escrow.disputeResolvedAt = new Date();
    await escrow.save();

    // ✅ Notify both parties
    const notifyPayload = {
      title: "Dispute Resolved by Admin",
      message: `"${escrow.projectId?.title}": ${notifyMessage}`,
      type: "dispute_resolved",
    };

    await createNotification({ userId: escrow.smeId._id, ...notifyPayload, link: "/dashboard/escrow-management" });
    await createNotification({ userId: escrow.freelancerId._id, ...notifyPayload, link: "/dashboard/my-proposals" });

    res.json({ success: true, message: "Dispute resolved successfully", escrow });
  } catch (err) {
    res.status(500).json({ message: "Failed to resolve dispute" });
  }
};

exports.simulatePayment = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, message: "Test mode not allowed in production" });
    }

    const { escrowId } = req.body;
    const escrow = await Escrow.findById(escrowId)
      .populate("projectId", "title")
      .populate("freelancerId", "_id fullName");

    if (!escrow) return res.status(404).json({ success: false, message: "Escrow not found" });
    if (escrow.smeId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    escrow.status = "Funded";
    escrow.paymentStatus = "Verified";
    escrow.esewaTransactionCode = "TEST_" + Date.now();
    escrow.paymentVerifiedAt = new Date();
    escrow.timeline.push({ action: "🧪 TEST MODE: Payment simulated - Escrow funded" });
    await escrow.save();

    await Project.findByIdAndUpdate(escrow.projectId, { status: "In Progress" });

    // ✅ Notify freelancer even in test mode
    await createNotification({
      userId: escrow.freelancerId._id,
      title: "Escrow Funded — Start Working!",
      message: `₹${escrow.amount} has been deposited into escrow for "${escrow.projectId?.title}". You can now submit your work.`,
      type: "escrow_funded",
      link: "/dashboard/my-proposals",
    });

    res.json({ success: true, message: "Test payment completed! Escrow funded.", escrow });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to simulate payment: " + err.message });
  }
};

exports.testEsewaSignature = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ success: false, message: "Not allowed in production" });
    }
    const { amount } = req.body;
    const total_amount = String(Math.floor(Number(amount || 100)));
    const paymentData = createEsewaPaymentForm(total_amount, "test-escrow-id");
    res.json({ success: true, paymentData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};