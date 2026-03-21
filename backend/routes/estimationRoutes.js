const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const { estimateProject } = require("../controllers/EstimationController");

// POST /api/estimate  — SME only, must be logged in
router.post("/", auth, estimateProject);

module.exports = router;