const request = require("supertest");
const app = require("../server"); // your express app
const mongoose = require("mongoose");

describe("Auth API Tests", () => {

  // Successful Registration
  test("Register user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        password: "password123",
        confirmPassword: "password123",
        role: "Freelancer"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User registered successfully");
  });

  // Registration with existing email
  test("Register with existing email should fail", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "john@test.com",
        password: "password123",
        confirmPassword: "password123"
      });

    expect(res.statusCode).toBe(400);
  });

  // Invalid email format
  test("Register with invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "invalid-email",
        password: "password123",
        confirmPassword: "password123"
      });

    expect(res.statusCode).toBe(400);
  });

  // Password mismatch
  test("Register with password mismatch", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@test.com",
        password: "password123",
        confirmPassword: "password456"
      });

    expect(res.statusCode).toBe(400);
  });

  // Successful login
  test("Login successfully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "john@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  // Login with wrong password
  test("Login with incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "john@test.com",
        password: "wrongpassword"
      });

    expect(res.statusCode).toBe(400);
  });

  // Login with unregistered email
  test("Login with non-existing email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nouser@test.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(400);
  });

  //  Login with empty fields
  test("Login with missing email/password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "",
        password: ""
      });

    expect(res.statusCode).toBe(400);
  });

});