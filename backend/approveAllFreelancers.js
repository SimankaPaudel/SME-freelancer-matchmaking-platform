// Approve all freelancers for KYC and email verification
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function approveFreelancers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

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


    // Show the updated freelancers
    const freelancers = await User.find({ role: "Freelancer" }).select(
      "fullName email skills isEmailVerified kycStatus hourlyRate"
    );

    freelancers.forEach((f, i) => {
    });

    process.exit(0);
  } catch (err) {
    
    process.exit(1);
  }
}

approveFreelancers();
