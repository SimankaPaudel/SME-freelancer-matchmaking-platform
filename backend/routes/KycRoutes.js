const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { uploadKYCDocument, getKYCStatus } = require("../controllers/KycController");

router.post("/upload", auth, uploadKYCDocument);
router.get ("/status", auth, getKYCStatus);

module.exports = router;