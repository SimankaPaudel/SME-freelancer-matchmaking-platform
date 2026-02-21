const Proposal = require("../models/Proposal");
const Project = require("../models/Project");
const Escrow = require("../models/EscrowPayment");

/**
 * Submit proposal (Freelancer only)
 */
exports.submitProposal = async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can apply" });
    }

    const proposalFile = req.files?.proposalFile?.[0];
    const cvFile = req.files?.cvFile?.[0];

    if (!proposalFile || !cvFile) {
      return res
        .status(400)
        .json({ message: "Both proposal and CV files are required" });
    }

    const normalizePath = (p) => p.replace(/\\/g, "/");

    const proposal = await Proposal.create({
      projectId: req.body.projectId,
      bidAmount: req.body.bidAmount,
      description: req.body.description,
      freelancerId: req.user.userId,
      proposalFile: normalizePath(proposalFile.path),
      proposalFileName: proposalFile.originalname,
      cvFile: normalizePath(cvFile.path),
      cvFileName: cvFile.originalname,
      status: "Submitted",
    });

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
      .populate("freelancerId", "fullName email")
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

    console.log("\n📝 Updating Proposal Status");
    console.log("   Proposal ID:", proposal._id);
    console.log("   New Status:", status);
    console.log("   Bid Amount (NPR):", proposal.bidAmount);

    // Update proposal status
    proposal.status = status;
    await proposal.save();

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