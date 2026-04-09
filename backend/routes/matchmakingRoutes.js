const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const matchmakingCtrl = require("../controllers/MatchmakingController");

// ── SME routes: Find matching freelancers for a project ──────────────────
router.get("/test", matchmakingCtrl.test);
router.get("/project/:projectId/matching-freelancers", auth, matchmakingCtrl.getMatchingFreelancers);
router.post("/send-invite", auth, matchmakingCtrl.sendInvite);

// ── Freelancer routes: Find matching projects ───────────────────────────
router.get("/freelancer/matching-projects", auth, matchmakingCtrl.getMatchingProjects);

module.exports = router;
