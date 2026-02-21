const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Get all notifications for logged-in user (newest first)
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all notifications as read for logged-in user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

/**
 * DELETE /api/notifications/clear-all
 * Delete all notifications for logged-in user
 */
exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.userId });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear notifications" });
  }
};