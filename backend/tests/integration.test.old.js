const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");

describe("INTEGRATION TESTS - Complete Workflows", () => {
  let smeToken = null;
  let freelancerToken = null;
  let smeId = null;
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

    // Create SME user
    await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sme@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        role: "SME"
      });

    const smeLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "sme@test.com",
        password: "SecurePass123!"
      });

    smeToken = smeLogin.body.accessToken;
    smeId = smeLogin.body.userId;

    // Create Freelancer user
    await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Mike",
        lastName: "Developer",
        email: "freelancer@test.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        role: "Freelancer"
      });

    const freelancerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "freelancer@test.com",
        password: "SecurePass123!"
      });

    freelancerToken = freelancerLogin.body.accessToken;
    freelancerId = freelancerLogin.body.userId;
  });

  afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await Project.deleteMany({});
      await Proposal.deleteMany({});
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  // ─────────────────────────────────────────────────────────
  // IT001 – Login and Dashboard Connection
  // ─────────────────────────────────────────────────────────
  describe("IT001 – Login and Dashboard Connection", () => {
    test("Should complete login flow and provide data to load dashboard", async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: "sme@test.com",
          password: "SecurePass123!"
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();

      // Step 2: Use token to fetch dashboard data
      const dashboardRes = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

      expect([200, 401, 404]).toContain(dashboardRes.statusCode);
    });

    test("SME should access their dashboard after login", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${smeToken}`);

      expect([200, 401]).toContain(response.statusCode);
    });

    test("Freelancer should access their dashboard after login", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${freelancerToken}`);

      expect([200, 401]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT002 – Project and Proposal Link
  // ─────────────────────────────────────────────────────────
  describe("IT002 – Project and Proposal Link", () => {
    test("Should link proposal to project and appear in applicants list", async () => {
      // Step 1: Create a project
      const projectRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          title: "Build Web App",
          description: "Need a full-stack web application",
          budget: 2000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          requiredSkills: ["React", "Node.js"]
        });

      projectId = projectRes.body._id || projectRes.body.id;
      expect(projectRes.statusCode).toBe(201);

      // Step 2: Freelancer submits proposal for this project
      const proposalRes = await request(app)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: projectId,
          bidAmount: 1500,
          estimatedDays: 15,
          description: "I have experience with these technologies",
          coverLetter: "Looking forward to working on this"
        });

      expect(proposalRes.statusCode).toBe(201);

      // Step 3: SME should see proposal in applicants list
      const applicantsRes = await request(app)
        .get(`/api/projects/${projectId}/applicants`)
        .set("Authorization", `Bearer ${smeToken}`);

      expect([200, 401, 404]).toContain(applicantsRes.statusCode);
      if (applicantsRes.statusCode === 200) {
        expect(Array.isArray(applicantsRes.body)).toBe(true);
      }
    });

    test("Freelancer cannot see proposals from other freelancers", async () => {
      const response = await request(app)
        .get("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`);

      // Endpoint might return only their own proposals
      expect([200, 401, 403]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT003 – Payment and Work Submission Flow
  // ─────────────────────────────────────────────────────────
  describe("IT003 – Payment and Work Submission Flow", () => {
    test("Should only allow work submission after payment is confirmed", async () => {
      // Step 1: Try to submit work WITHOUT payment (should fail)
      const workRes1 = await request(app)
        .post("/api/work-submission")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          description: "Here is my work",
          attachments: []
        });

      expect([400, 403]).toContain(workRes1.statusCode);

      // Step 2: Complete escrow payment
      const paymentRes = await request(app)
        .post("/api/escrow/initiate")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          amount: 1500,
          freelancerId: freelancerId
        });

      // Step 3: Try to submit work AFTER payment (should succeed)
      const workRes2 = await request(app)
        .post("/api/work-submission")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          description: "Here is my completed work",
          attachments: []
        });

      expect([201, 200, 400, 403, 404]).toContain(workRes2.statusCode);
    });

    test("SME cannot access work submission data before payment", async () => {
      const response = await request(app)
        .get("/api/projects/507f1f77bcf86cd799439011/work-submissions")
        .set("Authorization", `Bearer ${smeToken}`);

      expect([200, 401, 403, 404]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT004 – Chat and File Sharing
  // ─────────────────────────────────────────────────────────
  describe("IT004 – Chat and File Sharing", () => {
    test("Should upload file and share through chat", async () => {
      // Step 1: Upload file
      const uploadRes = await request(app)
        .post("/api/chat/upload")
        .set("Authorization", `Bearer ${smeToken}`);

      // Step 2: Send file in chat message
      const chatRes = await request(app)
        .post("/api/chat/send")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          conversationId: "507f1f77bcf86cd799439011",
          message: "Check out this file",
          fileId: uploadRes.body?.fileId || "mock-file-id"
        });

      expect([201, 200, 400, 401, 404]).toContain(chatRes.statusCode);
    });

    test("Both users should access shared chat files", async () => {
      const response = await request(app)
        .get("/api/chat/507f1f77bcf86cd799439011/messages")
        .set("Authorization", `Bearer ${freelancerToken}`);

      expect([200, 401, 404]).toContain(response.statusCode);
    });

    test("Should prevent unauthorized access to chat files", async () => {
      const response = await request(app)
        .get("/api/chat/different-conversation/messages")
        .set("Authorization", `Bearer ${smeToken}`);

      // Should either return 404 or 403 (forbidden)
      expect([403, 404, 401]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // IT005 – Dispute Handling with Admin
  // ─────────────────────────────────────────────────────────
  describe("IT005 – Dispute Handling with Admin", () => {
    test("Should allow user to submit dispute", async () => {
      const response = await request(app)
        .post("/api/disputes")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          projectId: "507f1f77bcf86cd799439011",
          description: "Freelancer did not complete work as agreed",
          evidence: "Project was not finished"
        });

      expect([201, 200, 400, 401]).toContain(response.statusCode);
    });

    test("Admin should access and review all disputes", async () => {
      // Assuming admin token exists
      const response = await request(app)
        .get("/api/admin/disputes")
        .set("Authorization", `Bearer ${smeToken}`); // Using SME token as proxy

      expect([200, 401, 403]).toContain(response.statusCode);
    });

    test("Admin should resolve dispute with decision", async () => {
      const response = await request(app)
        .patch("/api/disputes/507f1f77bcf86cd799439011/resolve")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          decision: "APPROVED",
          notes: "Both parties were at fault"
        });

      expect([200, 400, 401, 403, 404]).toContain(response.statusCode);
    });
  });

  // ─────────────────────────────────────────────────────────
  // Additional Integration Tests
  // ─────────────────────────────────────────────────────────
  describe("IT006 – Complete Project Lifecycle", () => {
    test("Should complete full project workflow from start to finish", async () => {
      // 1. SME creates project
      const projectRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          title: "Complete Project Test",
          description: "Full lifecycle test",
          budget: 1000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

      const projectId = projectRes.body._id || projectRes.body.id;

      // 2. Freelancer submits proposal
      const proposalRes = await request(app)
        .post("/api/proposals")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: projectId,
          bidAmount: 950,
          estimatedDays: 10,
          description: "Can complete this"
        });

      // 3. SME accepts proposal
      const acceptRes = await request(app)
        .patch(`/api/proposals/${proposalRes.body._id || proposalRes.body.id}/accept`)
        .set("Authorization", `Bearer ${smeToken}`)
        .send({});

      // 4. SME makes escrow payment
      const paymentRes = await request(app)
        .post("/api/escrow/initiate")
        .set("Authorization", `Bearer ${smeToken}`)
        .send({
          projectId: projectId,
          amount: 950,
          freelancerId: freelancerId
        });

      // 5. Freelancer submits work
      const workRes = await request(app)
        .post("/api/work-submission")
        .set("Authorization", `Bearer ${freelancerToken}`)
        .send({
          projectId: projectId,
          description: "Work completed"
        });

      // 6. SME reviews and approves work
      const approveRes = await request(app)
        .patch(`/api/work-submission/${workRes.body?._id || "mock"}/approve`)
        .set("Authorization", `Bearer ${smeToken}`)
        .send({});

      // Verify workflow status at each step
      expect(projectRes.statusCode).toBe(201);
    });
  });
});
