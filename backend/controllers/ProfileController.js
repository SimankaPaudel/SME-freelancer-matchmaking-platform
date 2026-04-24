const User = require("../models/User");

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/auth/profile  â€” current user's profile
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId).select("-password -refreshToken -emailVerifyToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PUT /api/profile/setup  â€” first-time profile setup
// PUT /api/profile/update â€” edit profile later
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function saveProfile(req, res) {
  try {
    const userId = req.user.userId;
    const user   = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "Freelancer") {
      const {
        bio, skills, hourlyRate, projectRate,
        weeklyAvailability, socialLinks,
      } = req.body;

      if (bio)                user.bio                = bio;
      if (skills)             user.skills             = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim());
      if (hourlyRate)         user.hourlyRate         = Number(hourlyRate);
      if (projectRate)        user.projectRate        = Number(projectRate);
      if (weeklyAvailability) user.weeklyAvailability = Number(weeklyAvailability);
      if (socialLinks)        user.socialLinks        = { ...user.socialLinks, ...socialLinks };

    } else if (user.role === "SME") {
      const {
        companyName, industryType, teamSize,
        preferredTechnologies, budgetRange,
        website, description,
      } = req.body;

      if (companyName)             user.companyName  = companyName;
      if (industryType)            user.industryType = industryType;
      if (teamSize)                user.teamSize     = teamSize;
      if (preferredTechnologies)   user.preferredTechnologies = Array.isArray(preferredTechnologies)
        ? preferredTechnologies
        : preferredTechnologies.split(",").map(s => s.trim());
      if (budgetRange)             user.budgetRange  = budgetRange;
      if (website)                 user.website      = website;
      if (description)             user.description  = description;
    }

    user.isProfileComplete = true;
    await user.save();

    const updated = await User.findById(userId).select("-password -refreshToken -emailVerifyToken");
    res.json({ message: "Profile saved successfully", user: updated });

  } catch (err) {
    
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/profile/portfolio  â€” add portfolio item
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function addPortfolioItem(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "Freelancer") return res.status(403).json({ message: "Only freelancers can add portfolio items" });

    const { title, description, link, type } = req.body;
    const fileUrl = req.file ? req.file.path.replace(/\\/g, "/") : undefined;

    user.portfolio.push({ title, description, link, type, fileUrl });
    await user.save();

    res.json({ message: "Portfolio item added", portfolio: user.portfolio });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/profile/cv  â€” upload CV (Freelancer only)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/cv/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `cv-${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadCV = multer({
  storage: cvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX files are allowed"));
    }
  },
}).single("cv");

async function uploadCVFile(req, res) {
  uploadCV(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.role !== "Freelancer") return res.status(403).json({ message: "Only freelancers can upload CV" });

      user.cv = req.file.path.replace(/\\/g, "/");
      await user.save();

      res.json({
        message: "CV uploaded successfully",
        cv: user.cv,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /api/profile/cv  â€” delete CV
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function deleteCVFile(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "Freelancer") return res.status(403).json({ message: "Only freelancers can delete CV" });

    // Delete file from system
    if (user.cv && fs.existsSync(user.cv)) {
      fs.unlinkSync(user.cv);
    }

    user.cv = "";
    await user.save();

    res.json({ message: "CV deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /api/profile/portfolio/:itemId
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function deletePortfolioItem(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.portfolio = user.portfolio.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await user.save();

    res.json({ message: "Portfolio item deleted", portfolio: user.portfolio });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/profile/:userId  â€” public profile view
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getPublicProfile(req, res) {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password -refreshToken -emailVerifyToken -emailVerifyExpires -kycDocument -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/auth/profile/photo  â€” upload profile photo
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function uploadProfilePhoto(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const photoPath = req.file.path.replace(/\\/g, "/");
    user.profilePhoto = photoPath;
    await user.save();

    res.json({ message: "Profile photo uploaded successfully", profilePhoto: user.profilePhoto });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /api/auth/profile/photo  â€” delete profile photo
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function deleteProfilePhoto(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePhoto = "";
    await user.save();

    res.json({ message: "Profile photo deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { getProfile, saveProfile, addPortfolioItem, deletePortfolioItem, getPublicProfile, uploadCVFile, deleteCVFile, uploadProfilePhoto, deleteProfilePhoto };