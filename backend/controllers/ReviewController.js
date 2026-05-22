const Review = require("../models/Review");
const Escrow = require("../models/EscrowPayment");
const User   = require("../models/User");
const { createNotification } = require("../utils/notificationHelper");

// ─── helper: compute average from a list of numeric values ───
function computeAvg(values) {
  const valid = values.filter((v) => typeof v === "number" && !isNaN(v));
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// POST /api/reviews
// ─────────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const reviewerId   = req.user.userId;
    const reviewerRole = req.user.role; // "SME" | "Freelancer"

    const {
      escrowId,
      // SME → Freelancer
      qualityRating,
      communicationRating,
      punctualityRating,
      professionalismRating,
      // Freelancer → SME
      sme_professionalismRating,
      sme_communicationRating,
      paymentTimelinessRating,
      // shared
      comment,
    } = req.body;

    // 1. Load escrow — all IDs are direct fields on EscrowPayment
    const escrow = await Escrow.findById(escrowId);
    if (!escrow)
      return res.status(404).json({ message: "Escrow not found." });

    if (escrow.status !== "Released")
      return res.status(400).json({
        message: "Reviews can only be submitted after payment is released.",
      });

    const escrowSmeId        = escrow.smeId.toString();
    const escrowFreelancerId = escrow.freelancerId.toString();
    const projectId          = escrow.projectId;

    // 2. Determine direction
    let reviewType, revieweeId;

    if (reviewerRole === "SME") {
      if (reviewerId !== escrowSmeId)
        return res.status(403).json({ message: "This escrow does not belong to you." });
      reviewType = "SME_TO_FREELANCER";
      revieweeId = escrowFreelancerId;
    } else if (reviewerRole === "Freelancer") {
      if (reviewerId !== escrowFreelancerId)
        return res.status(403).json({ message: "This escrow does not belong to you." });
      reviewType = "FREELANCER_TO_SME";
      revieweeId = escrowSmeId;
    } else {
      return res.status(403).json({ message: "Unauthorized role." });
    }

    // 3. Duplicate check
    const existing = await Review.findOne({ escrowId, reviewerId });
    if (existing)
      return res.status(409).json({ message: "You have already reviewed this project." });

    // 4. Validate & build ratings
    let ratingFields = {};
    let averageRating = 0;

    if (reviewType === "SME_TO_FREELANCER") {
      const q  = Number(qualityRating);
      const c  = Number(communicationRating);
      const p  = Number(punctualityRating);
      const pr = Number(professionalismRating);

      if (!q || !c || !p || !pr || [q,c,p,pr].some(v => v < 1 || v > 5))
        return res.status(400).json({ message: "All four ratings (1–5) are required." });

      ratingFields   = { qualityRating: q, communicationRating: c, punctualityRating: p, professionalismRating: pr };
      averageRating  = computeAvg([q, c, p, pr]);

    } else {
      const sp = Number(sme_professionalismRating);
      const sc = Number(sme_communicationRating);
      const pt = Number(paymentTimelinessRating);

      if (!sp || !sc || !pt || [sp,sc,pt].some(v => v < 1 || v > 5))
        return res.status(400).json({ message: "All three ratings (1–5) are required." });

      ratingFields  = { sme_professionalismRating: sp, sme_communicationRating: sc, paymentTimelinessRating: pt };
      averageRating = computeAvg([sp, sc, pt]);
    }

    // 5. Save — averageRating computed here, no pre-save hook needed
    const review = await Review.create({
      escrowId,
      projectId,
      reviewerId,
      revieweeId,
      reviewType,
      comment: (comment || "").trim(),
      averageRating,
      ...ratingFields,
    });

    // 6. Update reviewee's aggregate on User doc
    await recalcUserRating(revieweeId);
    
    // 7. Notify the reviewed party
    const reviewer = await User.findById(reviewerId).select("fullName role");
    const reviewee = await User.findById(revieweeId).select("fullName");
    
    const notificationType = reviewType === "SME_TO_FREELANCER" ? "Freelancer" : "Client";
    
    await createNotification({
      userId: revieweeId,
      title: `⭐ New Review from ${reviewer.role}`,
      message: `${reviewer.fullName} left a ${averageRating}/5 star review: "${(comment || "No comment").substring(0, 50)}..."`,
      type: "general",
      link: `/dashboard/my-reviews`,
    });

    return res.status(201).json({ message: "Review submitted successfully.", review });

  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: "You have already reviewed this project." });
    res.status(500).json({ message: err.message });
  }
};


// GET /api/reviews/user/:userId  — public profile

exports.getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ revieweeId: userId })
      .populate("reviewerId", "fullName role")
      .populate("projectId",  "title")
      .sort({ createdAt: -1 });

    res.json({ reviews, stats: buildStats(reviews) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// GET /api/reviews/escrow/:escrowId  

exports.getReviewByEscrow = async (req, res) => {
  try {
    const { escrowId } = req.params;
    const userId = req.user.userId;

    const myReview   = await Review.findOne({ escrowId, reviewerId: userId });
    const allReviews = await Review.find({ escrowId })
      .populate("reviewerId", "fullName role");

    res.json({ myReview, allReviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
async function recalcUserRating(userId) {
  try {
    const reviews = await Review.find({ revieweeId: userId });
    if (!reviews.length) return;

    const avg = computeAvg(reviews.map((r) => r.averageRating));
    await User.findByIdAndUpdate(userId, {
      averageRating: avg,
      totalReviews:  reviews.length,
    });
  } catch (err) {
  }
}

function buildStats(reviews) {
  if (!reviews.length)
    return { totalReviews: 0, averageRating: 0, breakdown: {} };

  const sme = reviews.filter((r) => r.reviewType === "SME_TO_FREELANCER");
  const fl  = reviews.filter((r) => r.reviewType === "FREELANCER_TO_SME");

  const avg = (arr, key) => {
    const vals = arr.map((r) => r[key]).filter((v) => typeof v === "number");
    return vals.length ? computeAvg(vals) : null;
  };

  return {
    totalReviews:  reviews.length,
    averageRating: computeAvg(reviews.map((r) => r.averageRating)),
    breakdown: {
      quality:             avg(sme, "qualityRating"),
      communication:       avg(sme, "communicationRating"),
      punctuality:         avg(sme, "punctualityRating"),
      professionalism:     avg(sme, "professionalismRating"),
      sme_professionalism: avg(fl,  "sme_professionalismRating"),
      sme_communication:   avg(fl,  "sme_communicationRating"),
      paymentTimeliness:   avg(fl,  "paymentTimelinessRating"),
    },
  };
}