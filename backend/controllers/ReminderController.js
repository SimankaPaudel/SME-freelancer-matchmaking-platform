const Escrow = require("../models/EscrowPayment");
const Project = require("../models/Project");
const nodemailer = require("nodemailer");

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Check deadlines and send reminders
 * Run this as a cron job (daily)
 */
exports.checkDeadlines = async () => {
  try {
    const escrows = await Escrow.find({
      status: { $in: ["Funded", "In Progress"] },
      reminderSent: false
    })
    .populate("projectId")
    .populate("freelancerId", "email fullName")
    .populate("smeId", "email fullName");

    for (const escrow of escrows) {
      if (!escrow.projectId?.deadline) continue;

      const now = new Date();
      const deadline = new Date(escrow.projectId.deadline);
      const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

      // Send reminder 3 days before deadline
      if (daysUntilDeadline === 3) {
        await sendDeadlineReminder(escrow);
        escrow.reminderSent = true;
        await escrow.save();
      }

      // Send urgent reminder 1 day before
      if (daysUntilDeadline === 1) {
        await sendUrgentReminder(escrow);
      }

      // Handle overdue projects
      if (daysUntilDeadline < 0 && escrow.status === "Funded") {
        await handleOverdueProject(escrow);
      }
    }

    console.log("Deadline check completed");
  } catch (err) {
    console.error("Deadline check error:", err);
  }
};

async function sendDeadlineReminder(escrow) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: escrow.freelancerId.email,
    subject: `Reminder: Project "${escrow.projectId.title}" deadline in 3 days`,
    html: `
      <h2>Project Deadline Reminder</h2>
      <p>Hi ${escrow.freelancerId.fullName},</p>
      <p>This is a reminder that your project <strong>"${escrow.projectId.title}"</strong> is due in 3 days.</p>
      <p><strong>Deadline:</strong> ${new Date(escrow.projectId.deadline).toLocaleDateString()}</p>
      <p><strong>Amount:</strong> ₹${escrow.amount}</p>
      <p>Please ensure you submit your work on time.</p>
      <p>Best regards,<br>Your Platform Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  
  // Also notify SME
  await transporter.sendMail({
    ...mailOptions,
    to: escrow.smeId.email,
    html: `
      <h2>Project Deadline Approaching</h2>
      <p>Hi ${escrow.smeId.fullName},</p>
      <p>Project <strong>"${escrow.projectId.title}"</strong> is due in 3 days.</p>
      <p>The freelancer has been notified.</p>
    `
  });
}

async function sendUrgentReminder(escrow) {
  // Similar to above but with urgent messaging
}

async function handleOverdueProject(escrow) {
  escrow.timeline.push({ action: "Project overdue - automatic dispute initiated" });
  escrow.status = "Disputed";
  escrow.disputeReason = "Automatic - Deadline exceeded";
  await escrow.save();
  
  // Notify both parties
}

module.exports = exports;