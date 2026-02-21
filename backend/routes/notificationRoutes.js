const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/NotificationController");
const auth = require("../middleware/authMiddleware");

// All routes require authentication
router.get("/", auth, ctrl.getMyNotifications);
router.patch("/mark-all-read", auth, ctrl.markAllAsRead);
router.delete("/clear-all", auth, ctrl.clearAll);
router.patch("/:id/read", auth, ctrl.markAsRead);
router.delete("/:id", auth, ctrl.deleteNotification);

module.exports = router;