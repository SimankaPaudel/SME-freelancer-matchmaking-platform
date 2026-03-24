// Run this ONCE from your backend folder:
// node createAdmin.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("./models/User");

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const existing = await User.findOne({ email: "admin@taskhive.com" });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash("Admin@1234", 10);

  await User.create({
    firstName: "Task",
    lastName:  "Admin",
    fullName:  "Task Admin",
    email:     "admin@taskhive.com",
    password:  hashed,
    role:      "Admin",
    isEmailVerified: true,
    isProfileComplete: true,
    kycStatus: "Approved",
  });

  console.log("Admin created!");
  console.log("   Email:    admin@taskhive.com");
  console.log("   Password: Admin@1234");
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});