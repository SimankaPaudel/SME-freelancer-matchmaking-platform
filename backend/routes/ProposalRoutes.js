const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const proposalCtrl = require("../controllers/ProposalController");
const uploadProposal = require("../middleware/uploadProposal");

// Wrap multer in a safe callback
const uploadFiles = (req, res, next) => {
  uploadProposal.fields([
    { name: "proposalFile", maxCount: 1 },
    { name: "cvFile", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Routes
router.post("/", auth, uploadFiles, proposalCtrl.submitProposal);
router.get("/download", auth, proposalCtrl.downloadFile); // ✅ Add this
router.get("/project/:projectId", auth, proposalCtrl.getProjectProposals);
router.get("/mine", auth, proposalCtrl.getMyProposals);
router.patch("/:id/status", auth, proposalCtrl.updateProposalStatus);

module.exports = router;