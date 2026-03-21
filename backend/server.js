require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const proposalRoutes = require("./routes/ProposalRoutes");
const escrowRoutes = require("./routes/escrowRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes"); 
const reviewRoutes = require("./routes/reviewRoutes"); 
const adminRoutes = require("./routes/adminRoutes");
const estimationRoutes = require("./routes/estimationRoutes");

       // ← NEW

const { startDeadlineReminders } = require("./utils/deadlineReminder");

const app = express();
const server = http.createServer(app);                      // ← NEW

// Socket.IO setup
const io = new Server(server, {                             // ← NEW
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.set("io", io);                                          // ← makes io accessible in controllers

io.on("connection", (socket) => {
  // Client calls joinRoom with a conversationId to receive messages for that chat
  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("disconnect", () => {});
});

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/escrows", escrowRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes); 
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/estimate", estimationRoutes);
                          // ← NEW

app.get("/", (req, res) =>
  res.json({ activeStatus: true, error: false })
);

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {                                 // ← changed app.listen → server.listen
  console.log(`✅ Server running on port ${PORT}`);
  startDeadlineReminders();
});