const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Notification content
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Type controls the icon/color on the frontend
    type: {
      type: String,
      enum: [
        "proposal_accepted",
        "proposal_received",
        "escrow_funded",
        "work_submitted",
        "work_approved",
        "work_rejected",
        "dispute_raised",
        "dispute_resolved",
        "payment_released",
        "deadline_reminder",
        "general",
      ],
      default: "general",
    },

    // Optional link to navigate to when clicked
    link: {
      type: String,
      default: null,
    },

    // Read / unread
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast queries by user
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);