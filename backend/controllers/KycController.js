const User   = require("../models/User");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// ── Multer storage for KYC docs ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/kyc/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `kyc-${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const uploadKYC = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, JPG, JPEG, PNG files are allowed"));
    }
  },
}).single("kycDocument");

// ─────────────────────────────────────────────────────────
// POST /api/kyc/upload
// ─────────────────────────────────────────────────────────
exports.uploadKYCDocument = (req, res) => {
  uploadKYC(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    try {
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.kycDocument = req.file.path.replace(/\\/g, "/");
      user.kycStatus   = "Pending";
      user.kycNote     = "";
      await user.save();

      res.json({
        message:     "KYC document uploaded successfully. Awaiting admin review.",
        kycStatus:   user.kycStatus,
        kycDocument: user.kycDocument,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
};

// ─────────────────────────────────────────────────────────
// GET /api/kyc/status
// ─────────────────────────────────────────────────────────
exports.getKYCStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("kycStatus kycDocument kycNote");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      kycStatus:   user.kycStatus,
      kycDocument: user.kycDocument,
      kycNote:     user.kycNote,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};