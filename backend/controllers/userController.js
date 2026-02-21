const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function userController(req, res) {
  try {
    const { firstName, lastName, fullName, email, password, confirmPassword, role } = req.body;

    // Check required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password length check
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    // Password validation - must contain at least one letter AND one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ 
        message: "Password must contain at least one letter and one number" 
      });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate role
    const allowedRoles = ["Freelancer", "SME"];
    const finalRole = allowedRoles.includes(role) ? role : "Freelancer";

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Compute full name
    const computedFullName = fullName?.trim() !== "" ? fullName : `${firstName} ${lastName}`;

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      fullName: computedFullName,
      email,
      password: hashedPassword,
      role: finalRole,
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "15m" }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: "7d" }
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        fullName: user.fullName 
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    
    // More detailed error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error",
        details: error.message
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Email already registered"
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "15m" }
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        fullName: user.fullName 
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = { userController, loginController };