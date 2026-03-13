const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    escrowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Escrow",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // "SME_TO_FREELANCER" or "FREELANCER_TO_SME"
    reviewType: {
      type: String,
      enum: ["SME_TO_FREELANCER", "FREELANCER_TO_SME"],
      required: true,
    },

    // SME → Freelancer ratings
    qualityRating:         { type: Number, min: 1, max: 5 },
    communicationRating:   { type: Number, min: 1, max: 5 },
    punctualityRating:     { type: Number, min: 1, max: 5 },
    professionalismRating: { type: Number, min: 1, max: 5 },

    // Freelancer → SME ratings
    sme_professionalismRating: { type: Number, min: 1, max: 5 },
    sme_communicationRating:   { type: Number, min: 1, max: 5 },
    paymentTimelinessRating:   { type: Number, min: 1, max: 5 },

    // Shared
    comment: { type: String, maxlength: 1000, default: "" },

    // Computed average — set by controller before saving, no hook needed
    averageRating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One review per reviewer per escrow
reviewSchema.index({ escrowId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);