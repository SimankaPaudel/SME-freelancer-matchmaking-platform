// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { userController, loginController } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// PUBLIC ROUTES
router.post("/register", userController);
router.post("/login", loginController);

// REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) return res.status(403).json({ message: "Invalid refresh token" });

    const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// PROTECTED PROFILE ROUTE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("Profile route error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
