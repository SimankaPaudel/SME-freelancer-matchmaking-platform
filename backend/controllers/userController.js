const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

// ─────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────
async function userController(req, res) {
  try {
    const { firstName, lastName, fullName, email, password, confirmPassword, role } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "All required fields must be filled" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters long" });

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
      return res.status(400).json({ message: "Password must contain at least one letter and one number" });

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return res.status(400).json({ message: "Password must contain at least one special character" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const allowedRoles  = ["Freelancer", "SME"];
    const finalRole     = allowedRoles.includes(role) ? role : "Freelancer";

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword   = await bcrypt.hash(password, 10);
    const computedFullName = fullName?.trim() || `${firstName} ${lastName}`;

    const user = await User.create({
      firstName,
      lastName,
      fullName:        computedFullName,
      email,
      password:        hashedPassword,
      role:            finalRole,
      isEmailVerified: true, // auto-verified, no email step
    });

    res.status(201).json({
      message: "Registration successful! Please login with your credentials.",
    });

  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "ValidationError")
      return res.status(400).json({ message: "Validation error", details: error.message });
    if (error.code === 11000)
      return res.status(400).json({ message: "Email already registered" });
    res.status(500).json({ message: "Internal server error" });
  }
}

// ─────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────
async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (user.isActive === false)
      return res.status(403).json({ message: "Your account has been deactivated. Contact support." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id:                user._id,
        email:             user.email,
        role:              user.role,
        fullName:          user.fullName,
        isProfileComplete: user.isProfileComplete,
        kycStatus:         user.kycStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ─────────────────────────────────────────────────────────
// SEARCH FREELANCERS
// ─────────────────────────────────────────────────────────
async function searchFreelancers(req, res) {
  try {
    const query = req.query.q || "";
    
    const freelancers = await User.find({
      role: "Freelancer",
      isActive: true,
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { skills: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id fullName skills hourlyRate averageRating totalReviews")
      .limit(10);

    res.json(freelancers);
  } catch (error) {
    console.error("Search freelancers error:", error);
    res.status(500).json({ message: "Failed to search freelancers" });
  }
}

// ─────────────────────────────────────────────────────────
// SEARCH SMEs
// ─────────────────────────────────────────────────────────
async function searchSMEs(req, res) {
  try {
    const query = req.query.q || "";
    
    const smes = await User.find({
      role: "SME",
      isActive: true,
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { companyName: { $regex: query, $options: "i" } },
        { companyDescription: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("_id fullName companyName companyDescription email")
      .limit(10);

    res.json(smes);
  } catch (error) {
    console.error("Search SMEs error:", error);
    res.status(500).json({ message: "Failed to search SMEs" });
  }
}

module.exports = { userController, loginController, searchFreelancers, searchSMEs };