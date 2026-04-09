const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("[AUTH] Auth Middleware DEBUG:");
  console.log("  authHeader:", authHeader);
  console.log("  JWT_SECRET exists:", !!process.env.JWT_SECRET);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No token provided or invalid format");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    console.log("  token:", token.substring(0, 20) + "...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("✅ Token verified successfully");
    console.log("  decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};
