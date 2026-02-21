require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const proposalRoutes = require("./routes/ProposalRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const { startDeadlineReminders } = require("./utils/deadlineReminder");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/escrows", escrowRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => res.send("Backend is working"));

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startDeadlineReminders();
});