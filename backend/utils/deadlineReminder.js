/**
 * deadlineReminder.js
 * Sends email reminders to freelancers when a project deadline is within 2 days.
 * Called from server.js on startup.
 *
 * Requirements:
 *   npm install node-cron nodemailer
 *
 * .env variables needed:
 *   EMAIL_USER=your-gmail@gmail.com
 *   EMAIL_PASS=your-gmail-app-password   (16-char Google App Password)
 */

const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Escrow = require("../models/EscrowPayment");

// ── Nodemailer transporter ────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Helper: send one email ────────────────────────────────────────────────

async function sendReminderEmail({ to, freelancerName, projectTitle, deadline, amount }) {
  const deadlineStr = new Date(deadline).toLocaleDateString("en-NP", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const mailOptions = {
    from: `"FreelanceNepal Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject: `⏰ Deadline Reminder: "${projectTitle}" is due in 2 days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #e53e3e;">⏰ Project Deadline Reminder</h2>
        <p>Hi <strong>${freelancerName}</strong>,</p>
        <p>
          This is a reminder that your project <strong>"${projectTitle}"</strong> has a deadline
          coming up in <strong>2 days</strong>.
        </p>

        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Project</td>
            <td style="padding: 8px; border: 1px solid #e0e0e0;">${projectTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Deadline</td>
            <td style="padding: 8px; border: 1px solid #e0e0e0;">${deadlineStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Escrow Amount</td>
            <td style="padding: 8px; border: 1px solid #e0e0e0;">₹${amount}</td>
          </tr>
        </table>

        <p>Please make sure to submit your work before the deadline via the platform.</p>

        <a href="${process.env.FRONTEND_URL}/dashboard/my-proposals"
           style="display: inline-block; margin-top: 12px; padding: 12px 24px;
                  background-color: #3182ce; color: white; text-decoration: none;
                  border-radius: 6px; font-weight: bold;">
          Go to My Proposals
        </a>

        <p style="margin-top: 24px; font-size: 12px; color: #718096;">
          If you have already submitted your work, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Reminder sent to ${to} for project "${projectTitle}"`);
}

// ── Main cron job ─────────────────────────────────────────────────────────

function startDeadlineReminders() {
  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("\n⏰ Running deadline reminder cron job...");

    try {
      const now = new Date();
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      // Find escrows that are active and haven't had a reminder sent
      const escrows = await Escrow.find({
        status: { $in: ["Funded", "In Progress"] },
        reminderSent: false,
      })
        .populate({
          path: "projectId",
          select: "title deadline",
        })
        .populate("freelancerId", "fullName email");

      let reminderCount = 0;

      for (const escrow of escrows) {
        const project = escrow.projectId;
        const freelancer = escrow.freelancerId;

        // Skip if no deadline or deadline is not within the next 2 days
        if (!project?.deadline) continue;

        const deadline = new Date(project.deadline);
        const isWithin2Days = deadline > now && deadline <= twoDaysLater;

        if (!isWithin2Days) continue;

        try {
          await sendReminderEmail({
            to: freelancer.email,
            freelancerName: freelancer.fullName,
            projectTitle: project.title,
            deadline: project.deadline,
            amount: escrow.amount,
          });

          // Mark reminder as sent so we don't spam
          escrow.reminderSent = true;
          escrow.timeline.push({
            action: "Deadline reminder email sent to freelancer",
          });
          await escrow.save();

          reminderCount++;
        } catch (emailErr) {
          console.error(
            `❌ Failed to send reminder for escrow ${escrow._id}:`,
            emailErr.message
          );
        }
      }

      console.log(`✅ Deadline reminders sent: ${reminderCount}`);
    } catch (err) {
      console.error("❌ Deadline reminder cron error:", err.message);
    }
  });

  console.log("✅ Deadline reminder cron job scheduled (runs daily at 9:00 AM)");
}

module.exports = { startDeadlineReminders };