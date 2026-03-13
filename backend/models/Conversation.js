// models/Conversation.js
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    lastMessage: { type: String },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);