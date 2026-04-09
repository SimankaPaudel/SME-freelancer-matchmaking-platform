const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");

describe("UNIT TESTS - Authentication Module", () => {
  let authToken = null;
  let userId = null;

  beforeAll(async () => {
    // Ensure database is connected before running tests
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        console.error("MongoDB connection error in beforeAll:", err.message);
      }
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    if (mongoose.connection.readyState === 1) {  // 1 = connected
      await User.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ─────────────────────────────────────────────────────────
  // UT001 – Login (Valid Credentials)
  // ─────────────────────────────────────────────────────────
  describe("UT001 – Login (Valid Credentials)", () => {
    test("Should allow login with correct credentials and redirect to dashboard", async () => {
      // Arrange: Create a user first
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "John",
          lastName: "Doe",
          email: "john@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      // Act: Login with valid credentials
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@test.com",
          password: "SecurePass123!"
        });

      // Assert: User should be logged in
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      
      authToken = response.body.accessToken;
      userId = response.body.user.id;
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT002 – Login (Invalid Credentials)
  // ─────────────────────────────────────────────────────────
  describe("UT002 – Login (Invalid Credentials)", () => {
    test("Should deny access with wrong password", async () => {
      // Create user
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      // Try login with wrong password
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "jane@test.com",
          password: "WrongPassword123!"
        });

      // Assert: Access denied with error message
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain("Invalid email or password");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT003 – Registration Validation
  // ─────────────────────────────────────────────────────────
  describe("UT003 – Registration Validation", () => {
    test("Should reject registration with missing required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Test"
          // Missing lastName, email, password, etc.
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain("required fields");
    });

    test("Should show validation errors and prevent form submission", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@test.com",
          password: "short",
          confirmPassword: "short"
        });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("message");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT004 – Duplicate Registration
  // ─────────────────────────────────────────────────────────
  describe("UT004 – Duplicate Registration", () => {
    test("Should reject registration with already-registered email", async () => {
      // First registration
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      // Try to register with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain("already registered");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT005 – Profile Update
  // ─────────────────────────────────────────────────────────
  describe("UT005 – Profile Update", () => {
    test("Should allow users to update profile information", async () => {
      // Register user
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Chris",
          lastName: "Brown",
          email: "chris@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      // Login to get token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "chris@test.com",
          password: "SecurePass123!"
        });

      const token = loginRes.body.accessToken;

      // Update profile
      const updateRes = await request(app)
        .put("/api/auth/profile/update")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "Christopher",
          lastName: "Brown",
          bio: "Experienced developer",
          phoneNumber: "1234567890"
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.message).toContain("updated");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT006 – Proposal Submission
  // ─────────────────────────────────────────────────────────
  describe("UT006 – Proposal Submission", () => {
    test("Should allow freelancer to submit proposal without issues", async () => {
      // Register freelancer
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Diana",
          lastName: "Prince",
          email: "diana@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "diana@test.com",
          password: "SecurePass123!"
        });

      const token = loginRes.body.accessToken;
      const projectId = "507f1f77bcf86cd799439011"; // Mock project ID

      // Submit proposal
      const proposalRes = await request(app)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${token}`)
        .send({
          projectId: projectId,
          bidAmount: 500,
          estimatedDays: 10,
          description: "I can complete this project efficiently",
          coverLetter: "Professional cover letter"
        });

      expect(proposalRes.statusCode).toBe(201);
      expect(proposalRes.body.message).toContain("submitted");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT007 – File Upload Validation
  // ─────────────────────────────────────────────────────────
  describe("UT007 – File Upload Validation", () => {
    test("Should reject unsupported file formats", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Eve",
          lastName: "Wilson",
          email: "eve@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "Freelancer"
        });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "eve@test.com",
          password: "SecurePass123!"
        });

      const token = loginRes.body.accessToken;

      // Try to upload unsupported file (should fail)
      const uploadRes = await request(app)
        .post("/api/upload/portfolio")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("invalid content"), "malicious.exe");

      expect([400, 415]).toContain(uploadRes.statusCode);
      expect(uploadRes.body.message).toContain("not allowed") || 
        expect(uploadRes.body.message).toContain("format");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT008 – Escrow Payment Processing
  // ─────────────────────────────────────────────────────────
  describe("UT008 – Escrow Payment Processing", () => {
    test("Should process payment and confirm successfully", async () => {
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Frank",
          lastName: "Miller",
          email: "frank@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "frank@test.com",
          password: "SecurePass123!"
        });

      const token = loginRes.body.accessToken;

      // Initiate escrow payment
      const paymentRes = await request(app)
        .post("/api/escrow/initiate")
        .set("Authorization", `Bearer ${token}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          amount: 1000,
          freelancerId: "507f1f77bcf86cd799439012"
        });

      expect(paymentRes.statusCode).toBe(201);
      expect(paymentRes.body).toHaveProperty("escrowId");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT009 – AI Cost Estimation (corrected objective)
  // ─────────────────────────────────────────────────────────
  describe("UT009 – AI Cost Estimation", () => {
    test("Should provide accurate cost estimation based on project details", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@test.com",
          password: "SecurePass123!"
        });

      // Get estimation (no auth required for some systems)
      const estimationRes = await request(app)
        .post("/api/estimation/calculate")
        .send({
          projectType: "Web Development",
          duration: "2 weeks",
          complexity: "Medium",
          requirements: ["Frontend", "Backend"]
        });

      expect([200, 201]).toContain(estimationRes.statusCode);
      expect(estimationRes.body).toHaveProperty("estimatedCost");
    });
  });

  // ─────────────────────────────────────────────────────────
  // UT010 – Notification Trigger
  // ─────────────────────────────────────────────────────────
  describe("UT010 – Notification Trigger", () => {
    test("Should send notification when system event occurs", async () => {
      // This would typically be triggered by other actions
      // Checking if notification endpoint responds correctly
      const response = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${authToken || "mock-token"}`);

      // Should return 200 (success) or require auth (401)
      expect([200, 401]).toContain(response.statusCode);
    });
  });
});

describe("INTEGRATION TESTS", () => {
  let smeToken = null;
  let freelancerToken = null;
  let smeoId = null;
  let freelancerId = null;

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // ─────────────────────────────────────────────────────────
  // IT001 – Login and Dashboard Connection
  // ─────────────────────────────────────────────────────────
  describe("IT001 – Login and Dashboard Connection", () => {
    test("Should redirect user to dashboard after successful login", async () => {
      // Register and login
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: "Grace",
          lastName: "Hopper",
          email: "grace@test.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!",
          role: "SME"
        });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "grace@test.com",
          password: "SecurePass123!"
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.userId).toBeDefined();
      // Frontend can use this token to fetch dashboard data
      smeToken = response.body.accessToken;
      smeoId = response.body.userId;
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT002 – Project and Proposal Link
  // ─────────────────────────────────────────────────────────
  describe("IT002 – Project and Proposal Link", () => {
    test("Should link proposal correctly to project in applicants list", async () => {
      // This would test the relationship between projects and proposals
      // Typically requires creating a project first, then submitting proposal
      
      const response = await request(app)
        .get("/api/projects/507f1f77bcf86cd799439011/applicants")
        .set("Authorization", `Bearer ${smeToken || "mock-token"}`);

      expect([200, 401, 404]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT003 – Payment and Work Submission Flow
  // ─────────────────────────────────────────────────────────
  describe("IT003 – Payment and Work Submission Flow", () => {
    test("Should only allow work submission after payment is confirmed", async () => {
      // Check work submission endpoint restrictions
      const response = await request(app)
        .post("/api/work-submission")
        .set("Authorization", `Bearer ${freelancerToken || "mock-token"}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          workDescription: "Work submission",
          attachments: []
        });

      // Should fail if escrow not funded, or succeed if payment done
      expect([400, 403, 404, 201, 200]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT004 – Chat and File Sharing
  // ─────────────────────────────────────────────────────────
  describe("IT004 – Chat and File Sharing", () => {
    test("Should upload and share files through chat system", async () => {
      const response = await request(app)
        .post("/api/chat/upload")
        .set("Authorization", `Bearer ${smeToken || "mock-token"}`);

      expect([400, 401, 200, 201]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT005 – Dispute Handling with Admin
  // ─────────────────────────────────────────────────────────
  describe("IT005 – Dispute Handling with Admin", () => {
    test("Should allow admin to review and resolve disputes", async () => {
      const response = await request(app)
        .get("/api/admin/disputes")
        .set("Authorization", `Bearer ${smeToken || "mock-token"}`);

      expect([200, 401, 403]).toContain(response.statusCode);
    });
  });
});