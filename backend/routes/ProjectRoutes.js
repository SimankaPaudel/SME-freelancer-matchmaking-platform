const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const projectCtrl = require("../controllers/ProjectController");

// SME routes
router.post("/", auth, projectCtrl.createProject);
router.get("/mine", auth, projectCtrl.getMyProjects);

// More specific routes must come BEFORE generic :id route
router.patch("/:id/deadline", auth, projectCtrl.extendDeadline);
router.patch("/:id/status", auth, projectCtrl.updateStatus);
router.patch("/:id", auth, projectCtrl.updateProject);

// Generic single project route (must be AFTER specific routes with :id)
router.get("/:id", projectCtrl.getProjectById);

// Freelancer routes (this should be last to avoid conflicts)
router.get("/", auth, projectCtrl.getOpenProjects);

module.exports = router;
