const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const multer  = require("multer");
const path    = require("path");

const { userController, verifyEmailController, loginController, searchFreelancers, searchSMEs } = require("../controllers/userController");
const { getProfile, saveProfile, addPortfolioItem, deletePortfolioItem, getPublicProfile, uploadCVFile, deleteCVFile, uploadProfilePhoto, deleteProfilePhoto } = require("../controllers/ProfileController");
const User = require("../models/User");
const jwt  = require("jsonwebtoken");

// ── Portfolio file upload ─────────────────────────────────
const storage = multer.diskStorage({
  destination: "uploads/portfolio/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadPortfolio = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── Profile photo upload ──────────────────────────────────
const photoStorage = multer.diskStorage({
  destination: "uploads/profile-photos/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploadPhoto = multer({ storage: photoStorage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
  cb(null, true);
}});

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

// ── Search routes ────────────────────────────────────────
router.get("/search-freelancers", auth, searchFreelancers);
router.get("/search-smes",        auth, searchSMEs);

// ── Profile routes (protected) ────────────────────────────
router.get ("/profile",                            auth, getProfile);
router.put ("/profile/setup",                      auth, saveProfile);
router.put ("/profile/update",                     auth, saveProfile);
router.post("/profile/portfolio",                  auth, uploadPortfolio.single("file"), addPortfolioItem);
router.delete("/profile/portfolio/:itemId",        auth, deletePortfolioItem);
router.post("/profile/cv",                         auth, uploadCVFile);
router.delete("/profile/cv",                       auth, deleteCVFile);
router.post("/profile/photo",                      auth, uploadPhoto.single("photo"), uploadProfilePhoto);
router.delete("/profile/photo",                    auth, deleteProfilePhoto);
router.get ("/profile/:userId",                         getPublicProfile);

module.exports = router;