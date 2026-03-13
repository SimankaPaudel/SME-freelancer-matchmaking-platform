const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/chatupload");
const chatCtrl = require("../controllers/CommunicationController");

router.get("/my-conversations", auth, chatCtrl.getMyConversations);
router.get("/project/:projectId", auth, chatCtrl.getConversationByProject);
router.get("/:conversationId/messages", auth, chatCtrl.getMessages);
router.post("/:conversationId/message", auth, upload.single("file"), chatCtrl.sendMessage);

module.exports = router;