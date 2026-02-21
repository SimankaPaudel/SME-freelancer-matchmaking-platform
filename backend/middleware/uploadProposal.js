const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure folder exists
const uploadPath = "uploads/proposals";
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueName + path.extname(file.originalname);
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  allowedTypes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only PDF or Word files allowed"), false);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});