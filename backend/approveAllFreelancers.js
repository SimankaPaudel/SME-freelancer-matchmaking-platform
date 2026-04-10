// Approve all freelancers for KYC and email verification
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function approveFreelancers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    // Update all freelancers
    const result = await User.updateMany(
      { role: "Freelancer" },
      {
        $set: {
          isEmailVerified: true,
          kycStatus: "Approved",
          isActive: true,
        },
      }
    );

    console.log(` Approved ${result.modifiedCount} freelancers`);
    console.log(`   - isEmailVerified: true`);
    console.log(`   - kycStatus: Approved`);
    console.log(`   - isActive: true\n`);

    // Show the updated freelancers
    const freelancers = await User.find({ role: "Freelancer" }).select(
      "fullName email skills isEmailVerified kycStatus hourlyRate"
    );

    console.log("[INFO] Updated Freelancers:");
    freelancers.forEach((f, i) => {
      console.log(`${i + 1}. ${f.fullName} | Skills: ${f.skills?.join(", ") || "NONE"}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(" Error:", err.message);
    process.exit(1);
  }
}

approveFreelancers();
