const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Project = require("../models/Project");

exports.getConversationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    let convo = await Conversation.findOne({ projectId });
    if (!convo) {
      convo = await Conversation.create({
        projectId,
        participants: [...new Set([project.postedBy.toString(), userId])],
      });
    }

    if (!convo.participants.map((p) => p.toString()).includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const convos = await Conversation.find({ participants: userId })
      .populate("projectId", "title")
      .sort({ lastMessageAt: -1 });
    res.json(convos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate("senderId", "fullName role")
      .populate("replyTo", "content senderId")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, replyTo } = req.body;

    const msg = await Message.create({
      conversationId,
      senderId: req.user.userId,
      content,
      replyTo: replyTo || null,
      file: req.file
        ? {
            path: req.file.path,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
          }
        : null,
    });

    const populated = await msg.populate("senderId", "fullName role");

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content || "📎 File sent",
      lastMessageAt: new Date(),
    });

    // Emit via socket if available
    const io = req.app.get("io");
    if (io) io.to(conversationId).emit("newMessage", populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};