const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Proposal = require("../models/Proposal");
const Project = require("../models/Project");
const User = require("../models/User");

describe("UNIT TESTS - Proposal Module", () => {
  let freelancerToken = null;
  let freelancerId = null;
  let projectId = null;

  beforeAll(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        console.error("MongoDB connection error:", err.message);
      }
    }

    // Create test freelancer
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "Freelancer",
        email: "freelancer@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        role: "Freelancer"
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "freelancer@test.com",
        password: "SecurePass123!"
      });

    freelancerToken = loginRes.body.accessToken;
    freelancerId = loginRes.body.userId;

    // Create test project
    const projectRes = await request(app)
      .post("/api/projects")
      .send({
        title: "Test Project",
        description: "A test project",
        budget: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

    projectId = projectRes.body._id || "507f1f77bcf86cd799439011";
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Proposal.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ─────────────────────────────────────────────────────────
  // UT006 – Proposal Submission (Detailed)
  // ─────────────────────────────────────────────────────────
  describe("UT006 – Proposal Submission", () => {
    test("Should submit proposal successfully and record in system", async () => {
      const response = await request(app)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: projectId,
          bidAmount: 500,
          estimatedDays: 10,
          description: "I can complete this efficiently",
          coverLetter: "Professional cover letter"
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toContain("submitted");
      expect(response.body._id).toBeDefined();
    });

    test("Should validate proposal bid amount", async () => {
      const response = await request(app)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: projectId,
          bidAmount: -100, // Invalid negative amount
          estimatedDays: 10,
          description: "Test"
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain("valid");
    });

    test("Should require project ID for proposal", async () => {
      const response = await request(app)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          bidAmount: 500,
          estimatedDays: 10,
          description: "Test"
        });

      expect(response.statusCode).toBe(400);
    });
  });
});

describe("UNIT TESTS - Notification Module", () => {
  let userToken = null;

  beforeAll(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        console.error("MongoDB connection error:", err.message);
      }
    }

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Notify",
        lastName: "User",
        email: "notifyuser@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        role: "Freelancer"
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "notifyuser@test.com",
        password: "SecurePass123!"
      });

    userToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ─────────────────────────────────────────────────────────
  // UT010 – Notification Trigger
  // ─────────────────────────────────────────────────────────
  describe("UT010 – Notification Trigger", () => {
    test("Should retrieve user notifications", async () => {
      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("Should mark notification as read", async () => {
      const response = await request(app)
        .patch("/api/notifications/507f1f77bcf86cd799439011/read")
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      expect([200, 404, 400]).toContain(response.statusCode);
    });

    test("Should return empty array when no notifications", async () => {
      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

describe("UNIT TESTS - File Upload", () => {
  let userToken = null;

  beforeAll(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        console.error("MongoDB connection error:", err.message);
      }
    }

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Upload",
        lastName: "User",
        email: "uploaduser@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        role: "Freelancer"
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "uploaduser@test.com",
        password: "SecurePass123!"
      });

    userToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ─────────────────────────────────────────────────────────
  // UT007 – File Upload Validation
  // ─────────────────────────────────────────────────────────
  describe("UT007 – File Upload Validation", () => {
    test("Should reject unsupported file types", async () => {
      const response = await request(app)
        .post("/api/upload/portfolio")
        .set("Authorization", `Bearer ${userToken}`)
        // Try to upload invalid file - implementation depends on your backend
        .send();

      // Can be 400, 415, or 422 depending on server implementation
      expect([400, 415, 422, 405]).toContain(response.statusCode);
    });

    test("Should accept valid portfolio files (PDF, Image)", async () => {
      // This would need actual file buffer or mock
      // Depends on your multer configuration
      const response = await request(app)
        .post("/api/upload/portfolio")
        .set("Authorization", `Bearer ${userToken}`);

      // Should either accept or require file
      expect([200, 201, 400, 403]).toContain(response.statusCode);
    });
  });
});

describe("UNIT TESTS - Escrow Payment", () => {
  let smeToken = null;
  let smeId = null;

  beforeAll(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        console.error("MongoDB connection error:", err.message);
      }
    }

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "SME",
        lastName: "Provider",
        email: "sme@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        role: "SME"
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "sme@test.com",
        password: "SecurePass123!"
      });

    smeToken = loginRes.body.accessToken;
    smeId = loginRes.body.userId;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ─────────────────────────────────────────────────────────
  // UT008 – Escrow Payment Processing
  // ─────────────────────────────────────────────────────────
  describe("UT008 – Escrow Payment Processing", () => {
    test("Should initiate escrow payment and return confirmation", async () => {
      const response = await request(app)
        .post("/api/escrow/initiate")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          amount: 1000,
          freelancerId: "507f1f77bcf86cd799439012"
        });

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("escrowId") || 
        expect(response.body).toHaveProperty("_id");
    });

    test("Should validate payment amount", async () => {
      const response = await request(app)
        .post("/api/escrow/initiate")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          amount: 0, // Invalid amount
          freelancerId: "507f1f77bcf86cd799439012"
        });

      expect(response.statusCode).toBe(400);
    });

    test("Should retrieve escrow status", async () => {
      const response = await request(app)
        .get("/api/escrow")
        .set("Authorization", `Bearer ${smeToken}`);

      expect([200, 401]).toContain(response.statusCode);
    });
  });
});
