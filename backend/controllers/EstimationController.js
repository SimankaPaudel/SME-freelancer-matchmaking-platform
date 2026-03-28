const Project = require("../models/Project");
const EscrowPayment = require("../models/EscrowPayment");

// ─────────────────────────────────────────────────────────────────────────
// AI-FREE CUSTOM ESTIMATION ENGINE
// Uses platform data + intelligent algorithms instead of external AI APIs
// ─────────────────────────────────────────────────────────────────────────

// ── Complexity scoring based on keywords ──────────────────────────────────
function analyzeProjectComplexity(title, description, skillsArray, experienceLevel) {
  const text = `${title} ${description}`.toLowerCase();
  let complexityScore = 3; // Base: medium

  // High complexity indicators
  const highComplexityKeywords = [
    "ai", "machine learning", "deep learning", "blockchain", "web3",
    "real-time", "scalable", "microservices", "kubernetes", "devops",
    "video", "streaming", "3d", "game", "vr", "ar", "iot", "flutter", "react native"
  ];

  // Medium-high complexity
  const mediumHighKeywords = [
    "api", "integration", "database", "backend", "full stack", "mobile app",
    "payment", "ecommerce", "dashboard", "admin panel", "authentication"
  ];

  // Low complexity
  const lowComplexityKeywords = ["website", "landing page", "html", "css", "static", "simple"];

  // Count keywords
  const highCount = highComplexityKeywords.filter((kw) => text.includes(kw)).length;
  const mediumCount = mediumHighKeywords.filter((kw) => text.includes(kw)).length;
  const lowCount = lowComplexityKeywords.filter((kw) => text.includes(kw)).length;

  if (highCount > 0) complexityScore = 8 + highCount;
  else if (mediumCount > 0) complexityScore = 5 + mediumCount;
  else if (lowCount > 0) complexityScore = 2 + lowCount;

  // Adjust for number of skills
  complexityScore += Math.min(skillsArray.length * 0.5, 2);

  // Clamp between 1-10
  return Math.min(Math.max(Math.round(complexityScore), 1), 10);
}

// ── Timeline estimation (days) ────────────────────────────────────────────
function estimateTimeline(complexityScore, experienceLevel) {
  let baseTimeline;

  if (complexityScore <= 3) baseTimeline = [3, 7];       // Simple: 3-7 days
  else if (complexityScore <= 5) baseTimeline = [7, 14]; // Medium: 7-14 days
  else if (complexityScore <= 7) baseTimeline = [14, 30]; // High: 14-30 days
  else baseTimeline = [30, 60];                           // Very High: 30-60 days

  // Adjust for experience level
  const adjustmentFactors = {
    Beginner: 1.5,
    Intermediate: 1.0,
    Expert: 0.7,
  };

  const factor = adjustmentFactors[experienceLevel] || 1.0;

  return [
    Math.round(baseTimeline[0] * factor),
    Math.round(baseTimeline[1] * factor),
  ];
}

// ── Budget estimation based on Nepal market ───────────────────────────────
function estimateBudget(complexityScore, experienceLevel, marketData, skillsArray) {
  // Base rates per day in NPR (adjusted for Nepal market)
  const baseRates = {
    Beginner: 400,    // ₹400/day
    Intermediate: 800, // ₹800/day
    Expert: 1500,     // ₹1500/day
  };

  const baseRate = baseRates[experienceLevel] || 800;

  // Timeline for budget calculation
  const timeline = estimateTimeline(complexityScore, experienceLevel);
  const avgDays = (timeline[0] + timeline[1]) / 2;

  // Base budget
  let budgetMin = Math.round(baseRate * timeline[0]);
  let budgetMax = Math.round(baseRate * timeline[1] * 1.3); // Add 30% buffer

  // Complexity multiplier
  const complexityMultiplier = 0.5 + complexityScore / 10;
  budgetMin = Math.round(budgetMin * complexityMultiplier);
  budgetMax = Math.round(budgetMax * complexityMultiplier);

  // Skills premium (certain high-value skills command higher rates)
  const premiumSkills = ["blockchain", "ai", "machine learning", "devops", "kubernetes"];
  const hasPremiumSkill = skillsArray.some((sk) =>
    premiumSkills.some((ps) => sk.toLowerCase().includes(ps))
  );

  if (hasPremiumSkill) {
    budgetMin = Math.round(budgetMin * 1.4);
    budgetMax = Math.round(budgetMax * 1.4);
  }

  // Adjust with market data if available
  if (marketData.length > 0) {
    const marketAvg = marketData.reduce((sum, m) => sum + m.amount, 0) / marketData.length;
    const marketMin = Math.min(...marketData.map((m) => m.amount));
    const marketMax = Math.max(...marketData.map((m) => m.amount));

    // Blend with market data (70% algorithm, 30% market)
    budgetMin = Math.round(budgetMin * 0.7 + marketMin * 0.3);
    budgetMax = Math.round(budgetMax * 0.7 + marketMax * 0.3);
  }

  // Ensure reasonable range
  if (budgetMin > budgetMax) [budgetMin, budgetMax] = [budgetMax, budgetMin];
  budgetMin = Math.max(budgetMin, 2000); // Minimum ₹2000
  budgetMax = Math.max(budgetMax, budgetMin + 5000);

  return { budgetMin, budgetMax };
}

// ── Generate risk warnings ────────────────────────────────────────────────
function generateRiskWarnings(budgetMin, budgetMax, complexityScore, timeline, experienceLevel) {
  const warnings = [];

  // Risk: Low budget for complexity
  if (complexityScore >= 8 && budgetMax < 15000) {
    warnings.push("⚠️ Budget may be too low for this complexity level. Increase budget or reduce scope.");
  }

  // Risk: Tight timeline for complexity
  if (complexityScore >= 7 && timeline[1] < 21) {
    warnings.push("⚠️ Timeline may be too tight for this complexity. Consider extending deadline.");
  }

  // Risk: Beginner for complex project
  if (complexityScore >= 7 && experienceLevel === "Beginner") {
    warnings.push("⚠️ Consider requiring Intermediate/Expert level for this complex project.");
  }

  // Risk: Budget mismatch for timeline
  const avgDaily = budgetMax / ((timeline[0] + timeline[1]) / 2);
  if (avgDaily < 500) {
    warnings.push("💰 Budget translates to very low daily rate. Increase budget to attract quality freelancers.");
  }

  return warnings.slice(0, 3); // Max 3 warnings
}

// ──────────────────────────────────────────────────────────────────────────
// MAIN ESTIMATION ENDPOINT
// ──────────────────────────────────────────────────────────────────────────
exports.estimateProject = async (req, res) => {
  try {
    const { title, description, skills, experienceLevel } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    const skillsArray = Array.isArray(skills)
      ? skills
      : (skills || "").split(",").map((s) => s.trim()).filter(Boolean);

    // ── Fetch platform data ────────────────────────────────────
    const titleWords = title.split(" ").filter((w) => w.length > 3);
    const titleRegex = titleWords.length > 0 ? new RegExp(titleWords.join("|"), "i") : /.*/;

    const similarProjects = await Project.find({
      $or: [
        { title: titleRegex },
        { skills: { $in: skillsArray } },
        { description: titleRegex },
      ],
    })
      .select("title budgetMin budgetMax deadline createdAt skills experienceLevel")
      .limit(10)
      .lean();

    const releasedEscrows = await EscrowPayment.find({ status: "Released" })
      .populate("projectId", "title skills budgetMin budgetMax experienceLevel")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const marketData = releasedEscrows
      .filter((e) => e.projectId)
      .map((e) => ({
        amount: e.amount,
        skills: e.projectId.skills,
        experienceLevel: e.projectId.experienceLevel,
      }));

    const avgMarketRate =
      marketData.length > 0
        ? Math.round(marketData.reduce((s, e) => s + e.amount, 0) / marketData.length)
        : null;

    // ── Run estimation algorithm ────────────────────────────────
    const complexityScore = analyzeProjectComplexity(title, description, skillsArray, experienceLevel);
    const timeline = estimateTimeline(complexityScore, experienceLevel);
    const { budgetMin, budgetMax } = estimateBudget(complexityScore, experienceLevel, marketData, skillsArray);
    const riskWarnings = generateRiskWarnings(budgetMin, budgetMax, complexityScore, timeline, experienceLevel);

    // ── Determine confidence level ──────────────────────────────
    let confidenceLevel = "Medium";
    if (similarProjects.length >= 3 || marketData.length >= 5) {
      confidenceLevel = "High"; // More data = more confidence
    } else if (similarProjects.length === 0 && marketData.length < 2) {
      confidenceLevel = "Low"; // Little data = less confident
    }

    // ── Generate recommendation reasoning ──────────────────────
    const reasoning =
      `Based on ${similarProjects.length} similar projects and ${marketData.length} market data points, ` +
      `this ${complexityScore <= 3 ? "simple" : complexityScore <= 6 ? "moderately complex" : "highly complex"} project ` +
      `is estimated at ₹${budgetMin}-${budgetMax} over ${timeline[0]}-${timeline[1]} days. ` +
      (avgMarketRate ? `Platform average is ₹${avgMarketRate}.` : "");

    // ── Extract skills from description for suggestions ───────
    const allSkills = [...new Set([...skillsArray, ...skillsArray])];

    const estimation = {
      budgetMin,
      budgetMax,
      timelineMin: timeline[0],
      timelineMax: timeline[1],
      recommendedExperienceLevel: experienceLevel,
      complexityScore,
      confidenceLevel,
      riskWarnings,
      reasoning: reasoning.slice(0, 200), // Limit length
      suggestedSkills: skillsArray.slice(0, 5),
    };

    res.json({
      estimation,
      meta: {
        similarProjectsFound: similarProjects.length,
        marketDataPoints: marketData.length,
        avgMarketRate,
        poweredBy: "TaskHive Custom Algorithm (No external API)",
      },
    });
  } catch (err) {
    console.error("estimateProject error:", err);
    res.status(500).json({ message: err.message || "Estimation failed" });
  }
};

// Note: Estimation doesn't require notifications as it's a tool, not an action