const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SETUP AND TEARDOWN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("STRESS TESTS - System Reliability and Performance", () => {
  let testUsers = [];
  let testProjects = [];
  let tokens = {};

  beforeAll(async () => {
    // Ensure database is connected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fyp_test");
      } catch (err) {
        
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUsers.length > 0) {
      const userIds = testUsers.map(u => u._id);
      await User.deleteMany({ _id: { $in: userIds } });
    }
    if (testProjects.length > 0) {
      const projectIds = testProjects.map(p => p._id);
      await Project.deleteMany({ _id: { $in: projectIds } });
    }
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // HELPER FUNCTIONS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  
  /**
   * Create test users with specified roles
   */
  async function createTestUsers(count, role = "Freelancer") {
    const users = [];
    for (let i = 0; i < count; i++) {
      const email = `stresstest${role}${i}_${Date.now()}@test.com`;
      const password = "StressTest123!";
      
      // Register
      await request(app)
        .post("/api/auth/register")
        .send({
          firstName: `${role}${i}`,
          lastName: "StressTest",
          email,
          password,
          confirmPassword: password,
          role
        });

      // Get user from DB
      const user = await User.findOne({ email });
      users.push(user);
      
      // Login to get token
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email, password });

      tokens[user._id.toString()] = loginRes.body.accessToken;
    }
    testUsers.push(...users);
    return users;
  }

  /**
   * Create test projects
   */
  async function createTestProjects(smeUserId, count = 5) {
    const projects = [];
    for (let i = 0; i < count; i++) {
      const projectRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${tokens[smeUserId.toString()]}`)
        .send({
          title: `Stress Test Project ${i} - ${Date.now()}`,
          description: `This is a stress test project number ${i}`,
          budget: Math.floor(Math.random() * 10000) + 1000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: "Development",
          skills: ["Node.js", "React", "MongoDB"]
        });

      if (projectRes.body._id) {
        projects.push(projectRes.body);
      }
    }
    testProjects.push(...projects);
    return projects;
  }

  /**
   * Measure concurrent request performance
   */
  async function measureConcurrentRequests(requests, label = "Concurrent Requests") {
    const startTime = Date.now();
    const results = await Promise.allSettled(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;


    return {
      total: results.length,
      successful,
      failed,
      duration,
      avgPerRequest: duration / results.length,
      results
    };
  }

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ST001 â€“ High Volume Login Requests
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe("ST001 â€“ High Volume Login Requests", () => {
    test("Should handle 50 concurrent login requests without crashing", async () => {
      // Create 50 test users
      const users = await createTestUsers(50, "Freelancer");
      const password = "StressTest123!";

      // Prepare 50 concurrent login requests
      const loginRequests = users.map(user =>
        request(app)
          .post("/api/auth/login")
          .send({
            email: user.email,
            password
          })
      );

      // Execute and measure
      const results = await measureConcurrentRequests(loginRequests, "50 Concurrent Logins");

      // Assertions
      expect(results.successful).toBeGreaterThan(40); // At least 80% success
      expect(results.duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(results.avgPerRequest).toBeLessThan(300); // Avg response < 300ms

      // Verify all logins returned valid tokens
      const successfulResults = results.results
        .filter(r => r.status === "fulfilled")
        .map(r => r.value.body);

      successfulResults.forEach(body => {
        expect(body.accessToken).toBeDefined();
        expect(body.user).toBeDefined();
      });

    }, 60000); // 60 second timeout
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ST002 â€“ System Response During Heavy Activity
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  describe("ST002 â€“ System Response During Heavy Activity", () => {
    test("Should maintain responsiveness with multiple concurrent operations", async () => {
      // Create test users and projects
      const smeUsers = await createTestUsers(5, "SME");
      const freelancerUsers = await createTestUsers(10, "Freelancer");
      
      const projects = await createTestProjects(smeUsers[0]._id, 20);

      
      // Create mixed operations array
      const operations = [];

      // Add project browsing requests
      freelancerUsers.forEach(user => {
        operations.push(
          request(app)
            .get("/api/projects")
            .set("Authorization", `Bearer ${tokens[user._id.toString()]}`)
        );
      });

      // Add proposal submissions
      projects.slice(0, 5).forEach(project => {
        freelancerUsers.slice(0, 5).forEach(user => {
          operations.push(
            request(app)
              .post("/api/proposals")
              .set("Authorization", `Bearer ${tokens[user._id.toString()]}`)
              .send({
                projectId: project._id,
                bidAmount: Math.floor(Math.random() * 5000) + 500,
                timeline: "2-3 weeks",
                description: "I can deliver high quality work"
              })
          );
        });
      });

      // Add profile access requests
      freelancerUsers.forEach(user => {
        operations.push(
          request(app)
            .get(`/api/profile/${user._id}`)
        );
      });

      // Execute and measure
      const results = await measureConcurrentRequests(operations, "Mixed Heavy Operations");

      // Assertions
      expect(results.successful).toBeGreaterThan(results.total * 0.7); // At least 70% success
      expect(results.avgPerRequest).toBeLessThan(500); // Avg response < 500ms

    }, 90000); // 90 second timeout
  });



  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // SUMMARY REPORT
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  afterAll(async () => {
  });
});
