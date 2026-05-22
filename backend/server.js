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
const KycRoutes = require("./routes/KycRoutes");
const matchmakingRoutes = require("./routes/matchmakingRoutes");

       // â† NEW

const { startDeadlineReminders } = require("./utils/deadlineReminder");

const app = express();
const server = http.createServer(app);                      // â† NEW

// Socket.IO setup with CORS configuration
const io = new Server(server, {                             // † NEW
  cors: { 
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(origin => origin.trim()),
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io);                                          // â† makes io accessible in controllers

io.on("connection", (socket) => {
  // Client calls joinRoom with a conversationId to receive messages for that chat
  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("disconnect", () => {});
});

connectDB();

// Configure CORS with environment variables
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map(origin => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

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
app.use("/api/kyc", KycRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
                          // â† NEW

// app.get("/", (req, res) =>
//   res.json({ activeStatus: true, error: false })
// );

app.get("/", (req, res) => {
  return res.json({ message: "Welcome to TaskHive API!" });
})

app.use((err, req, res, next) => {
  
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// Only start server when NOT in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    startDeadlineReminders();
  });
}

// Export app for testing with Supertest
module.exports = app;
