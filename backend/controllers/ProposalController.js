const Proposal = require("../models/Proposal");
const Project = require("../models/Project");
const User = require("../models/User");
const Escrow = require("../models/EscrowPayment");
const { createNotification } = require("../utils/notificationHelper");

/**
 * Submit proposal (Freelancer only)
 */
exports.submitProposal = async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can apply" });
    }

    // Check if freelancer has KYC approval
    const user = await User.findById(req.user.userId).select("kycStatus");
    if (!user || user.kycStatus !== "Approved") {
      return res.status(403).json({ 
        message: "KYC approval is required to apply for projects. Please complete your KYC verification." 
      });
    }

    const proposalFile = req.files?.proposalFile?.[0];

    if (!proposalFile) {
      return res
        .status(400)
        .json({ message: "Proposal document is required" });
    }

    const normalizePath = (p) => p.replace(/\\/g, "/");

    const proposalData = {
      projectId: req.body.projectId,
      bidAmount: req.body.bidAmount,
      description: req.body.description,
      freelancerId: req.user.userId,
      proposalFile: normalizePath(proposalFile.path),
      proposalFileName: proposalFile.originalname,
      status: "Submitted",
    };

    const proposal = await Proposal.create(proposalData);
    
    // Notify SME that a new proposal was received
    const project = await Project.findById(req.body.projectId).select("postedBy title");
    if (project) {
      await createNotification({
        userId: project.postedBy,
        title: "New Proposal Received",
        message: `Your project "${project.title}" has received a new proposal for ₹${req.body.bidAmount}`,
        type: "proposal_received",
        link: `/dashboard/manage-projects/${req.body.projectId}`,
      });
    }

    res.status(201).json(proposal);
  } catch (err) {
    console.error("Submit proposal error:", err);
    res.status(500).json({ message: "Proposal submission failed" });
  }
};

/**
 * Get proposals for a project (SME only)
 */
exports.getProjectProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ projectId: req.params.projectId })
      .populate("freelancerId", "fullName email skills portfolio averageRating totalReviews hourlyRate bio socialLinks")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error("Get project proposals error:", err);
    res.status(500).json({ message: "Failed to fetch proposals" });
  }
};

/**
 * Get my proposals (Freelancer)
 */
exports.getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancerId: req.user.userId })
      .populate("projectId", "title budgetMin budgetMax deadline")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error("Get my proposals error:", err);
    res.status(500).json({ message: "Failed to fetch proposals" });
  }
};

/**
 * ✅ FIXED: Update proposal status - escrow amount is already in NPR (no conversion needed)
 */
exports.updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "Submitted",
      "Viewed",
      "Shortlisted",
      "Accepted",
      "Rejected",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    const project = await Project.findById(proposal.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    console.log("\n[INFO] Updating Proposal Status");
    console.log("   Proposal ID:", proposal._id);
    console.log("   New Status:", status);
    console.log("   Bid Amount (NPR):", proposal.bidAmount);

    // Update proposal status
    proposal.status = status;
    await proposal.save();
    
    // Populate freelancer info for notification
    const populatedProposal = await Proposal.findById(proposal._id).populate("freelancerId", "fullName");
    
    // Send notification based on status change
    if (status === "Accepted") {
      await createNotification({
        userId: proposal.freelancerId,
        title: "✅ Proposal Accepted",
        message: `Your proposal for "${project.title}" has been accepted! Escrow will be created shortly.`,
        type: "proposal_accepted",
        link: "/dashboard/escrow-management",
      });
    } else if (status === "Rejected") {
      await createNotification({
        userId: proposal.freelancerId,
        title: "❌ Proposal Rejected",
        message: `Your proposal for "${project.title}" was not selected. Keep trying!`,
        type: "general",
        link: "/dashboard/my-proposals",
      });
    }

    let escrow = null;

    if (status === "Accepted") {
      // Check if escrow already exists
      escrow = await Escrow.findOne({ proposalId: proposal._id });

      if (!escrow) {
        console.log("   Creating escrow...");
        
        // ✅ CRITICAL: Amount is already in NPR, use it directly
        // No conversion needed - bidAmount is in NPR from the proposal form
        const amountInNPR = proposal.bidAmount;

        escrow = await Escrow.create({
          projectId: project._id,
          proposalId: proposal._id,
          smeId: project.postedBy,
          freelancerId: proposal.freelancerId,
          amount: amountInNPR, // Already in NPR
          currency: "NPR",
          status: "Pending Deposit",
          paymentStatus: "Pending",
          paymentGateway: "eSewa",
          timeline: [
            { 
              action: `Proposal Accepted – Escrow Created (₹${amountInNPR})`
            }
          ],
        });

        console.log("   ✅ Escrow created:");
        console.log("      Escrow ID:", escrow._id);
        console.log("      Amount (NPR):", escrow.amount);
        console.log("      Currency:", escrow.currency);
      } else {
        console.log("   ⚠️ Escrow already exists:", escrow._id);
      }

      // Close the project to prevent other acceptances
      project.status = "Closed";
      await project.save();
      
      console.log("   ✅ Project closed");
    }

    console.log("   ✅ Proposal status updated\n");

    res.status(200).json({
      message: "Proposal status updated successfully",
      proposal,
      escrow, // return escrow immediately to frontend
    });
  } catch (err) {
    console.error("Update proposal status error:", err);
    res.status(500).json({ message: "Failed to update proposal status" });
  }
};

/**
 * Dummy download handler (safe placeholder)
 */
exports.downloadFile = async (req, res) => {
  res.status(200).json({ message: "Download endpoint placeholder" });
};

// Add this function to your existing ProposalController.js
// and add this route to ProposalRoutes.js:
// router.get("/project/:projectId/count", auth, proposalCtrl.getProposalCount);

exports.getProposalCount = async (req, res) => {
  try {
    const count = await Proposal.countDocuments({ projectId: req.params.projectId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cancel proposal (Freelancer only - only when status is "Submitted")
 */
exports.cancelProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Only freelancer who submitted can cancel
    if (proposal.freelancerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the freelancer who submitted the proposal can cancel it" });
    }

    // Only allow cancelling when status is "Submitted"
    if (proposal.status !== "Submitted") {
      return res.status(400).json({ 
        message: `Cannot cancel proposal with status "${proposal.status}". Only proposals with "Submitted" status can be cancelled.` 
      });
    }

    // Soft delete - change status to Cancelled
    proposal.status = "Cancelled";
    await proposal.save();

    res.json({ message: "Proposal cancelled successfully", proposal });
  } catch (err) {
    console.error("Cancel proposal error:", err);
    res.status(500).json({ message: "Failed to cancel proposal" });
  }
};

/**
 * Update proposal (Freelancer only - only when status is "Submitted")
 */
exports.updateProposal = async (req, res) => {
  try {
    const { bidAmount, description } = req.body;

    // Validate inputs
    if (bidAmount && (isNaN(bidAmount) || bidAmount <= 0)) {
      return res.status(400).json({ message: "Bid amount must be a positive number" });
    }
    if (description && !description.trim()) {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Only freelancer who submitted can edit
    if (proposal.freelancerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only the freelancer who submitted the proposal can edit it" });
    }

    // Only allow editing when status is "Submitted"
    if (proposal.status !== "Submitted") {
      return res.status(400).json({ message: `Cannot edit proposal with status "${proposal.status}". Only proposals with "Submitted" status can be edited.` });
    }

    // Update fields
    if (bidAmount !== undefined) proposal.bidAmount = Number(bidAmount);
    if (description !== undefined) proposal.description = description.trim();

    // Update file if provided
    const proposalFile = req.files?.proposalFile?.[0];
    if (proposalFile) {
      const normalizePath = (p) => p.replace(/\\/g, "/");
      proposal.proposalFile = normalizePath(proposalFile.path);
      proposal.proposalFileName = proposalFile.originalname;
    }

    const cvFile = req.files?.cvFile?.[0];
    if (cvFile) {
      const normalizePath = (p) => p.replace(/\\/g, "/");
      proposal.cvFile = normalizePath(cvFile.path);
      proposal.cvFileName = cvFile.originalname;
    }

    await proposal.save();
    res.json({ message: "Proposal updated successfully", proposal });
  } catch (err) {
    console.error("Update proposal error:", err);
    res.status(500).json({ message: "Failed to update proposal" });
  }
};