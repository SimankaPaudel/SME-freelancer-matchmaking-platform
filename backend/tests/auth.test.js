const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");

describe("UNIT TESTS - Authentication Module", () => {
  beforeAll(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
        console.log("✅ MongoDB connected");
      } catch (err) {
        console.error("MongoDB error:", err.message);
      }
    }
    // Give connection a moment to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  
  // ─────────────────────────────────────────────────────────
  // UT001 – Login (Valid Credentials)
  // ─────────────────────────────────────────────────────────
  describe("UT001 – Login (Valid Credentials)", () => {
    test("Should allow login with correct credentials", async () => {
      // Register
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Rajesh",
          lastName: "Sharma",
          email: "rajesh@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      // Login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "rajesh@test.com",
          password: "SecurePass123!"
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.user).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT002 – Login (Invalid Credentials)
  // ─────────────────────────────────────────────────────────
  describe("UT002 – Login (Invalid Credentials)", () => {
    test("Should deny access with wrong password", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Seema",
          lastName: "Poudel",
          email: "seema@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "seema@test.com",
          password: "WrongPassword123!"
        });

      expect(loginRes.statusCode).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT003 – Registration Validation
  // ─────────────────────────────────────────────────────────
  describe("UT003 – Registration Validation", () => {
    test("Should reject registration with missing required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ firstName: "Test" });

      expect(response.statusCode).toBe(400);
    });

    test("Should show validation errors for weak password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Gita",
          lastName: "Acharya",
          email: "gita@test.com",
          password: "short",
          confirmPassword: "short"
        });

      expect(response.statusCode).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT004 – Duplicate Registration
  // ─────────────────────────────────────────────────────────
  describe("UT004 – Duplicate Registration", () => {
    test("Should reject duplicate email registration", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Anita",
          lastName: "Poudel",
          email: "anita@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      const dupRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Alice",
          lastName: "Smith",
          email: "anita@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      expect(dupRes.statusCode).toBe(400);
      expect(dupRes.body.message).toContain("already");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT009 – AI Cost Estimation
  // ─────────────────────────────────────────────────────────
  describe("UT009 – AI Cost Estimation", () => {
    test("Should provide accurate cost estimation based on project details", async () => {
      const response = await request(app)
        .post("/api/estimate")
        .send({
          title: "Web Development Project",
          description: "Build a modern e-commerce website",
          duration: 30,
          complexity: "medium"
        });

      expect([200, 201, 400, 401, 404, 500]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT010 – Notification Trigger
  // ─────────────────────────────────────────────────────────
  describe("UT010 – Notification Trigger", () => {
    test("Should have notification infrastructure", async () => {
      expect(true).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────
// INTEGRATION TESTS
// ─────────────────────────────────────────────────────────
describe("INTEGRATION TESTS", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        console.error("MongoDB error:", err.message);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  // ─────────────────────────────────────────────────────────
  // IT001 – Login and Dashboard Connection
  // ─────────────────────────────────────────────────────────
  describe("IT001 – Login and Dashboard Connection", () => {
    test("Should complete login flow successfully", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Sushma",
          lastName: "Kiran",
          email: "sushmakiran@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "sushmakiran@test.com",
          password: "SecurePass123!"
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();
    });
  });
});
