const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const { createNotification } = require("../utils/notificationHelper");

exports.getConversationByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    let convo = await Conversation.findOne({ projectId });

    // If conversation exists, check if user should be added to participants
    if (convo) {
      const participants = convo.participants.map((p) => p.toString());
      
      // If user is already a participant, allow access
      if (participants.includes(userId)) {
        return res.json(convo);
      }

      // If user is the project poster, allow and add to participants
      if (project.postedBy.toString() === userId) {
        convo.participants.push(userId);
        await convo.save();
        return res.json(convo);
      }

      // If user has a proposal for this project, allow and add to participants
      const hasProposal = await Proposal.findOne({ projectId, freelancerId: userId });
      if (hasProposal) {
        convo.participants.push(userId);
        await convo.save();
        return res.json(convo);
      }

      // User is not authorized to access this conversation
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Conversation doesn't exist yet
    // Only project poster or someone with a proposal can create it
    const isProjectPoster = project.postedBy.toString() === userId;
    const hasProposal = await Proposal.findOne({ projectId, freelancerId: userId });

    if (!isProjectPoster && !hasProposal) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Create new conversation with both users
    convo = await Conversation.create({
      projectId,
      participants: [...new Set([project.postedBy.toString(), userId])],
    });

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
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Get conversation and verify authorization
    const convo = await Conversation.findById(conversationId).populate("projectId");
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    // Check if user is a participant in the conversation
    const participants = convo.participants.map((p) => p.toString());
    if (!participants.includes(userId)) {
      // Fallback: check if user is project poster or has a proposal
      const project = convo.projectId;
      const isProjectPoster = project.postedBy.toString() === userId;
      const hasProposal = await Proposal.findOne({ projectId: project._id, freelancerId: userId });

      if (!isProjectPoster && !hasProposal) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Add user to participants if authorized
      convo.participants.push(userId);
      await convo.save();
    }

    const messages = await Message.find({
      conversationId: conversationId,
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
    const userId = req.user.userId;
    const { content, replyTo } = req.body;

    // Get conversation and verify authorization
    const convo = await Conversation.findById(conversationId).populate("projectId");
    if (!convo) return res.status(404).json({ message: "Conversation not found" });

    // Check if user is authorized: is project poster or has a proposal for this project
    const project = convo.projectId;
    const isProjectPoster = project.postedBy.toString() === userId;
    const hasProposal = await Proposal.findOne({ projectId: project._id, freelancerId: userId });

    if (!isProjectPoster && !hasProposal) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add user to participants if not already there
    const participants = convo.participants.map((p) => p.toString());
    if (!participants.includes(userId)) {
      convo.participants.push(userId);
      await convo.save();
    }

    const msg = await Message.create({
      conversationId,
      senderId: userId,
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
      lastMessage: content || "[File] sent",
      lastMessageAt: new Date(),
    });

    // Notify other participants about new message (with error handling)
    try {
      // Get fresh conversation data to ensure participants are current
      const freshConvo = await Conversation.findById(conversationId);
      const otherParticipants = freshConvo.participants
        .map((p) => p.toString())
        .filter((p) => p !== userId);
      
      
      if (otherParticipants.length > 0) {
        const sender = await User.findById(userId).select("fullName");
        
        if (!sender) {
          console.warn("âš ï¸ Notification: Sender not found");
        } else {
          for (const participantId of otherParticipants) {
            try {
              await createNotification({
                userId: participantId,
                title: `New Message from ${sender.fullName}`,
                message: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                type: "general",
                link: `/dashboard/messages`,
              });
            } catch (notifErr) {
              
            }
          }
        }
      } else {
      }
    } catch (notifErr) {
      
    }

    // Emit via socket if available
    const io = req.app.get("io");
    if (io) io.to(conversationId).emit("newMessage", populated);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
