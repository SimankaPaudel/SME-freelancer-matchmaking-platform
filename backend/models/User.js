const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ── Core ──────────────────────────────────────────────
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    fullName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true },
    password:  { type: String, required: true },
    role:      { type: String, enum: ["Freelancer", "SME", "Admin"], default: "Freelancer" },

    // ── Email verification ────────────────────────────────
    isEmailVerified:    { type: Boolean, default: false },
    emailVerifyToken:   { type: String },
    emailVerifyExpires: { type: Date },

    // ── KYC ──────────────────────────────────────────────
    kycStatus:   { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    kycDocument: { type: String },
    kycNote:     { type: String, default: "" },

    // ── Account status ────────────────────────────────────
    isActive:          { type: Boolean, default: true },
    isProfileComplete: { type: Boolean, default: false },

    // ── Reviews ───────────────────────────────────────────
    averageRating: { type: Number, default: 0 },
    totalReviews:  { type: Number, default: 0 },

    // ── Refresh token ─────────────────────────────────────
    refreshToken: { type: String },

    // ════════════════════════════════════════════════════
    // FREELANCER PROFILE
    // ════════════════════════════════════════════════════
    skills:        { type: [String], default: [] },       // tag-based skills
    portfolio: [
      {
        title:       { type: String },
        description: { type: String },
        link:        { type: String }, // GitHub / live URL
        fileUrl:     { type: String }, // uploaded PDF/image
        type:        { type: String, enum: ["github", "live", "pdf", "image"], default: "live" },
      },
    ],
    hourlyRate:       { type: Number },                   // NPR per hour
    projectRate:      { type: Number },                   // NPR per project (min)
    weeklyAvailability: { type: Number },                 // hours per week
    socialLinks: {
      linkedin: { type: String, default: "" },
      github:   { type: String, default: "" },
      website:  { type: String, default: "" },
    },
    bio: { type: String, default: "", maxlength: 500 },
    cv: { type: String, default: "" }, // CV file path
    profilePhoto: { type: String, default: "" }, // Profile photo file path

    // ════════════════════════════════════════════════════
    // SME PROFILE
    // ════════════════════════════════════════════════════
    companyName:  { type: String, default: "" },
    industryType: { type: String, default: "" },
    teamSize: {
      type: String,
      enum: ["1-5", "6-20", "21-50", "51-200", "200+", ""],
      default: "",
    },
    preferredTechnologies: { type: [String], default: [] },
    budgetRange: {
      min: { type: Number },
      max: { type: Number },
    },
    website:     { type: String, default: "" },
    description: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);