const Notification = require("../models/Notification");

/**
 * Creates a notification for a user.
 * Call this from any controller after an important action.
 *
 * @param {Object} params
 * @param {string} params.userId     - recipient user _id
 * @param {string} params.title      - short heading
 * @param {string} params.message    - full notification text
 * @param {string} params.type       - one of the enum values in Notification model
 * @param {string} [params.link]     - optional frontend route to navigate to
 */
async function createNotification({ userId, title, message, type = "general", link = null }) {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    // Never let a notification failure crash the main flow
    console.error("⚠️ Failed to create notification:", err.message);
  }
}

/**
 * Convenience: send the same notification to multiple users at once.
 */
async function createNotificationForMany(userIds, { title, message, type, link }) {
  try {
    const docs = userIds.map((userId) => ({ userId, title, message, type, link }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error("⚠️ Failed to create notifications:", err.message);
  }
}

module.exports = { createNotification, createNotificationForMany };