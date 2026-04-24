// Debug script to check freelancers and matchmaking scores
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");

async function debugMatchmaking() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Check all freelancers
    const allFreelancers = await User.find({ role: "Freelancer" }).select(
      "fullName email skills isEmailVerified kycStatus isActive hourlyRate weeklyAvailability totalReviews averageRating"
    );
    
    allFreelancers.forEach((f, i) => {
    });

    // 2. Check filtered freelancers (what matchmaking sees)
    const filteredFreelancers = await User.find({
      role: "Freelancer",
      isActive: true,
      isEmailVerified: true,
      kycStatus: "Approved",
    });
    
    if (filteredFreelancers.length === 0) {
    }

    // 3. Check sample project
    const anyProject = await Project.findOne().lean();
    if (anyProject) {
    }

    process.exit(0);
  } catch (err) {
    
    process.exit(1);
  }
}

debugMatchmaking();
