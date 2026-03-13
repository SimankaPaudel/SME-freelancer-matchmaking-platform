const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const reviewCtrl = require("../controllers/ReviewController");

// Submit a review (SME or Freelancer, after escrow is Released)
router.post("/", auth, reviewCtrl.submitReview);

// Get all reviews for a user's public profile
router.get("/user/:userId", reviewCtrl.getReviewsForUser);

// Check review status for a specific escrow (authenticated)
router.get("/escrow/:escrowId", auth, reviewCtrl.getReviewByEscrow);

module.exports = router;