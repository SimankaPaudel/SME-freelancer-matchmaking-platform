const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const multer  = require("multer");
const path    = require("path");

const { userController, verifyEmailController, loginController } = require("../controllers/userController");
const { getProfile, saveProfile, addPortfolioItem, deletePortfolioItem, getPublicProfile, uploadCVFile, deleteCVFile } = require("../controllers/ProfileController");
const User = require("../models/User");
const jwt  = require("jsonwebtoken");

// ── Portfolio file upload ─────────────────────────────────
const storage = multer.diskStorage({
  destination: "uploads/portfolio/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadPortfolio = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Auth routes ───────────────────────────────────────────
router.post("/register",      userController);
router.post("/login",         loginController);


// Refresh token
router.post("/refresh", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Refresh token required" });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token)
      return res.status(403).json({ message: "Invalid refresh token" });
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  } catch {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// ── Profile routes (protected) ────────────────────────────
router.get ("/profile",                            auth, getProfile);
router.put ("/profile/setup",                      auth, saveProfile);
router.put ("/profile/update",                     auth, saveProfile);
router.post("/profile/portfolio",                  auth, uploadPortfolio.single("file"), addPortfolioItem);
router.delete("/profile/portfolio/:itemId",        auth, deletePortfolioItem);
router.post("/profile/cv",                         auth, uploadCVFile);
router.delete("/profile/cv",                       auth, deleteCVFile);
router.get ("/profile/:userId",                         getPublicProfile);

module.exports = router;