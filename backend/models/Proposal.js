const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bidAmount: Number,
    description: String,

    proposalFile: String,
    proposalFileName: String,
    cvFile: String,
    cvFileName: String,

    status: {
      type: String,
      enum: ["Submitted", "Viewed", "Shortlisted", "Accepted", "Rejected"],
      default: "Submitted",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
