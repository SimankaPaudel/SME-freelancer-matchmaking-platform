const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: true,
    },
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["Open", "Closed", "Cancelled"], default: "Open" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
