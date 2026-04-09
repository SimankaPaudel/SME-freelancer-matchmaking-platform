// Debug script to check freelancers and matchmaking scores
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Project = require("./models/Project");

async function debugMatchmaking() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    // 1. Check all freelancers
    console.log("[INFO] ALL FREELANCERS IN DATABASE:");
    const allFreelancers = await User.find({ role: "Freelancer" }).select(
      "fullName email skills isEmailVerified kycStatus isActive hourlyRate weeklyAvailability totalReviews averageRating"
    );
    
    console.log(`Found ${allFreelancers.length} freelancers\n`);
    allFreelancers.forEach((f, i) => {
      console.log(`${i + 1}. ${f.fullName}`);
      console.log(`   Email: ${f.email}`);
      console.log(`   Skills: ${f.skills?.join(", ") || "NONE"}`);
      console.log(`   Verified: ${f.isEmailVerified} | KYC: ${f.kycStatus} | Active: ${f.isActive}`);
      console.log(`   Rate: ${f.hourlyRate} NPR/hr | Availability: ${f.weeklyAvailability} hours/week`);
      console.log(`   Rating: ${f.averageRating} (${f.totalReviews} reviews)`);
      console.log("");
    });

    // 2. Check filtered freelancers (what matchmaking sees)
    console.log("[DEBUG] FILTERED FREELANCERS (Matchmaking Filter):");
    const filteredFreelancers = await User.find({
      role: "Freelancer",
      isActive: true,
      isEmailVerified: true,
      kycStatus: "Approved",
    });
    
    console.log(`Found ${filteredFreelancers.length} approved freelancers\n`);
    if (filteredFreelancers.length === 0) {
      console.log("⚠️  NO FREELANCERS MEET THE FILTER CRITERIA!");
      console.log("Requirements: isActive=true, isEmailVerified=true, kycStatus='Approved'\n");
    }

    // 3. Check sample project
    const anyProject = await Project.findOne().lean();
    if (anyProject) {
      console.log("[INFO] SAMPLE PROJECT:");
      console.log(`Title: ${anyProject.title}`);
      console.log(`Skills: ${anyProject.skills?.join(", ") || "NONE"}`);
      console.log(`Experience Level: ${anyProject.experienceLevel}`);
      console.log(`Budget: ₹${anyProject.budgetMin} - ₹${anyProject.budgetMax}`);
      console.log(`Deadline: ${new Date(anyProject.deadline).toLocaleDateString()}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

debugMatchmaking();
