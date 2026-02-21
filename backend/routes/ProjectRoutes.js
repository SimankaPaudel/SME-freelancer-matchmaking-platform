const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const projectCtrl = require("../controllers/ProjectController");

// SME routes
router.post("/", auth, projectCtrl.createProject);
router.get("/mine", auth, projectCtrl.getMyProjects);
router.patch("/:id/deadline", auth, projectCtrl.extendDeadline);
router.patch("/:id/status", auth, projectCtrl.updateStatus);

// Freelancer routes
router.get("/", auth, projectCtrl.getOpenProjects);

module.exports = router;
