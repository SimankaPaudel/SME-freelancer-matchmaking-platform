const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send email verification link ──────────────────────────
async function sendVerificationEmail({ to, fullName, token }) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"TaskHive" <${process.env.EMAIL_USER}>`,
    to,
    subject: "✅ Verify your TaskHive email address",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;border:1px solid #e0d4c0;border-radius:12px;background:#ffffff;">
        <h2 style="color:#4a3728;margin-top:0;">Welcome to TaskHive, ${fullName}! 🐝</h2>
        <p style="color:#7a6a55;font-size:15px;line-height:1.6;">
          Thanks for signing up. Please verify your email address to activate your account.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;margin:20px 0;padding:13px 28px;background:#b08968;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
          ✅ Verify Email Address
        </a>
        <p style="color:#a89880;font-size:13px;">
          This link expires in <strong>24 hours</strong>. If you didn't create an account, ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #e0d4c0;margin:24px 0;" />
        <p style="color:#a89880;font-size:12px;margin:0;">TaskHive · Nepal's Freelance Platform</p>
      </div>
    `,
  });

  console.log(`📧 Verification email sent to ${to}`);
}

module.exports = { transporter, sendVerificationEmail };