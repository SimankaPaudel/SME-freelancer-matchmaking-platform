const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Freelancer", "SME", "Admin"], default: "Freelancer" },
    isEmailVerified: { type: Boolean, default: false },
    kycStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    kycDocument: { type: String }, // file path or URL

    // refresh token
    refreshToken: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
