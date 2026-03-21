const User = require("../models/User");
const Project = require("../models/Project");
const EscrowPayment = require("../models/EscrowPayment");
const Review = require("../models/Review");

// ── helper ────────────────────────────────────────────────
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// ─────────────────────────────────────────────────────────
// GET /api/admin/analytics
// ─────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // ── User counts ──
    const totalUsers      = await User.countDocuments({ role: { $ne: "Admin" } });
    const totalFreelancers = await User.countDocuments({ role: "Freelancer" });
    const totalSMEs        = await User.countDocuments({ role: "SME" });
    const pendingKYC       = await User.countDocuments({ kycStatus: "Pending", kycDocument: { $exists: true, $ne: null } });

    // ── Project counts ──
    const totalProjects     = await Project.countDocuments();
    const activeProjects    = await Project.countDocuments({ status: "Open" });
    const completedProjects = await Project.countDocuments({ status: "Closed" });

    // ── Escrow / payment counts ──
    const totalEscrows   = await EscrowPayment.countDocuments();
    const disputedCount  = await EscrowPayment.countDocuments({ status: "Disputed" });
    const releasedEscrows = await EscrowPayment.find({ status: "Released" });
    const totalPayments  = releasedEscrows.reduce((sum, e) => sum + (e.amount || 0), 0);

    // ── Monthly transaction volume (last 6 months) ──
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = startOfMonth(d);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const escrows = await EscrowPayment.find({
        status: "Released",
        releasedAt: { $gte: start, $lt: end },
      });

      monthlyData.push({
        month:  d.toLocaleString("default", { month: "short", year: "2-digit" }),
        volume: escrows.reduce((s, e) => s + (e.amount || 0), 0),
        count:  escrows.length,
      });
    }

    // ── Top freelancers (by released escrow count) ──
    const topFreelancers = await EscrowPayment.aggregate([
      { $match: { status: "Released" } },
      { $group: { _id: "$freelancerId", completedJobs: { $sum: 1 }, totalEarned: { $sum: "$amount" } } },
      { $sort: { completedJobs: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 1, completedJobs: 1, totalEarned: 1, fullName: "$user.fullName", email: "$user.email" } },
    ]);

    // ── Most active SMEs (by project count) ──
    const topSMEs = await Project.aggregate([
      { $group: { _id: "$postedBy", projectCount: { $sum: 1 } } },
      { $sort: { projectCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 1, projectCount: 1, fullName: "$user.fullName", email: "$user.email" } },
    ]);

    // ── Dispute summary ──
    const disputedEscrows = await EscrowPayment.find({ status: "Disputed" })
      .populate("projectId", "title")
      .populate("freelancerId", "fullName email")
      .populate("smeId", "fullName email")
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      users:    { total: totalUsers, freelancers: totalFreelancers, smes: totalSMEs, pendingKYC },
      projects: { total: totalProjects, active: activeProjects, completed: completedProjects },
      payments: { total: totalPayments, escrows: totalEscrows, disputed: disputedCount },
      monthlyData,
      topFreelancers,
      topSMEs,
      disputedEscrows,
    });
  } catch (err) {
    console.error("getAnalytics error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { role, kycStatus, search, page = 1, limit = 20 } = req.query;
    const filter = { role: { $ne: "Admin" } };

    if (role)      filter.role      = role;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (search)    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle-active
// ─────────────────────────────────────────────────────────
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "Admin") return res.status(403).json({ message: "Cannot deactivate an admin" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User ${user.isActive ? "activated" : "deactivated"}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/kyc
// body: { status: "Approved" | "Rejected", note?: string }
// ─────────────────────────────────────────────────────────
exports.updateKYC = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ message: "Invalid KYC status" });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { kycStatus: status, kycNote: note || "" },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: `KYC ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/admin/projects
// ─────────────────────────────────────────────────────────
exports.getProjects = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) filter.title  = { $regex: search, $options: "i" };

    const total    = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate("postedBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ projects, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/admin/disputes
// ─────────────────────────────────────────────────────────
exports.getDisputes = async (req, res) => {
  try {
    const disputes = await EscrowPayment.find({ status: "Disputed" })
      .populate("projectId",    "title")
      .populate("freelancerId", "fullName email")
      .populate("smeId",        "fullName email")
      .sort({ updatedAt: -1 });

    res.json({ disputes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/disputes/:escrowId/resolve
// body: { resolution: "release" | "refund", note }
// ─────────────────────────────────────────────────────────
exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, note } = req.body;
    const escrow = await EscrowPayment.findById(req.params.escrowId);
    if (!escrow) return res.status(404).json({ message: "Escrow not found" });
    if (escrow.status !== "Disputed") return res.status(400).json({ message: "Escrow is not in dispute" });

    escrow.status = resolution === "release" ? "Released" : "Refunded";
    escrow.disputeResolution = note || `Resolved by admin: ${resolution}`;
    if (resolution === "release") escrow.releasedAt = new Date();
    escrow.timeline.push({ action: `Admin resolved dispute: ${escrow.status}`, date: new Date() });
    await escrow.save();

    res.json({ message: `Dispute resolved — ${escrow.status}`, escrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};