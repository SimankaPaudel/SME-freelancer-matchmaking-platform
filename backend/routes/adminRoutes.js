const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/authMiddleware");
const admin   = require("../middleware/adminMiddleware");
const ctrl    = require("../controllers/AdminController");

// All admin routes require auth + admin role
router.use(auth, admin);

router.get   ("/analytics",                    ctrl.getAnalytics);
router.get   ("/users",                        ctrl.getUsers);
router.patch ("/users/:id/toggle-active",      ctrl.toggleUserActive);
router.patch ("/users/:id/kyc",                ctrl.updateKYC);
router.get   ("/projects",                     ctrl.getProjects);
router.get   ("/disputes",                     ctrl.getDisputes);
router.patch ("/disputes/:escrowId/resolve",   ctrl.resolveDispute);

module.exports = router;