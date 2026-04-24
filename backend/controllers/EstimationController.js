const Project = require("../models/Project");
const EscrowPayment = require("../models/EscrowPayment");

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AI-FREE CUSTOM ESTIMATION ENGINE
// Uses platform data + intelligent algorithms instead of external AI APIs
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Complexity scoring based on keywords â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Timeline estimation (days) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Budget estimation based on Nepal market â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function estimateBudget(complexityScore, experienceLevel, marketData, skillsArray) {
  // Base rates per day in NPR (adjusted for Nepal market)
  const baseRates = {
    Beginner: 400,    // â‚¹400/day
    Intermediate: 800, // â‚¹800/day
    Expert: 1500,     // â‚¹1500/day
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
  budgetMin = Math.max(budgetMin, 2000); // Minimum â‚¹2000
  budgetMax = Math.max(budgetMax, budgetMin + 5000);

  return { budgetMin, budgetMax };
}

// â”€â”€ Generate risk warnings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateRiskWarnings(budgetMin, budgetMax, complexityScore, timeline, experienceLevel) {
  const warnings = [];

  // Risk: Low budget for complexity
  if (complexityScore >= 8 && budgetMax < 15000) {
    warnings.push("Budget may be too low for this complexity level. Increase budget or reduce scope.");
  }

  // Risk: Tight timeline for complexity
  if (complexityScore >= 7 && timeline[1] < 21) {
    warnings.push("Timeline may be too tight for this complexity. Consider extending deadline.");
  }

  // Risk: Beginner for complex project
  if (complexityScore >= 7 && experienceLevel === "Beginner") {
    warnings.push(" Consider requiring Intermediate/Expert level for this complex project.");
  }

  // Risk: Budget mismatch for timeline
  const avgDaily = budgetMax / ((timeline[0] + timeline[1]) / 2);
  if (avgDaily < 500) {
    warnings.push("Budget translates to very low daily rate. Increase budget to attract quality freelancers.");
  }

  return warnings.slice(0, 3); // Max 3 warnings
}

// â”€â”€ Improve project description - Professional Polishing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function improveDescription(title, description, skillsArray, complexityScore, timeline) {
  let originalDesc = description.trim();

  // Detect project category for contextual enhancement
  const text = `${title} ${originalDesc}`.toLowerCase();
  let projectCategory = "Technical Project";
  let contextualPhrases = [];

  // Categorize project and add relevant context phrases
  if (text.includes("website") || text.includes("web app") || text.includes("web")) {
    projectCategory = "Web Development";
    contextualPhrases = [
      "modern, responsive design",
      "optimal user experience",
      "cross-browser compatibility",
      "performance optimization"
    ];
  } else if (text.includes("mobile") || text.includes("app") || text.includes("react native") || text.includes("flutter")) {
    projectCategory = "Mobile Application";
    contextualPhrases = [
      "intuitive mobile interface",
      "seamless user experience",
      "platform compatibility",
      "performance optimization"
    ];
  } else if (text.includes("api") || text.includes("backend") || text.includes("server")) {
    projectCategory = "Backend Development";
    contextualPhrases = [
      "scalable architecture",
      "robust API design",
      "data integrity",
      "security best practices"
    ];
  } else if (text.includes("ai") || text.includes("machine learning") || text.includes("data")) {
    projectCategory = "AI/ML Solution";
    contextualPhrases = [
      "advanced algorithms",
      "data-driven insights",
      "intelligent automation",
      "predictive analytics"
    ];
  } else if (text.includes("blockchain") || text.includes("web3") || text.includes("cryptocurrency")) {
    projectCategory = "Blockchain/Web3";
    contextualPhrases = [
      "decentralized architecture",
      "smart contract development",
      "security and auditability",
      "blockchain best practices"
    ];
  }

  // Check if description is too brief (under 50 words)
  const wordCount = originalDesc.split(/\s+/).length;
  let expandedDesc = originalDesc;

  if (wordCount < 50) {
    // Expand brief description with professional context
    let expansion = originalDesc + "\n\n";
    
    expansion += "Project Overview:\n";
    expansion += `This ${projectCategory.toLowerCase()} project requires a ${
      complexityScore <= 3 ? "straightforward" : 
      complexityScore <= 6 ? "moderately complex" : 
      "sophisticated and feature-rich"
    } solution. We are seeking an experienced professional to develop a high-quality deliverable that meets modern industry standards.\n\n`;

    expansion += "Key Focus Areas:\n";
    const focusAreas = contextualPhrases.slice(0, 3);
    focusAreas.forEach((area, idx) => {
      expansion += `â€¢ ${area.charAt(0).toUpperCase() + area.slice(1)}\n`;
    });

    expansion += "\n";
    expandedDesc = expansion;
  } else {
    // Polish existing description
    expandedDesc = originalDesc + "\n\n";
  }

  // Add detailed sections

  // 1. REQUIREMENTS SECTION
  const hasRequirements = text.includes("require") || text.includes("need") || text.includes("must");
  if (!hasRequirements) {
    expandedDesc += "Requirements:\n";
    expandedDesc += `â€¢ Proficiency in ${skillsArray.slice(0, 2).join(" and ")}\n`;
    if (skillsArray.length > 2) {
      expandedDesc += `â€¢ Experience with ${skillsArray.slice(2, 4).join(", ")}\n`;
    }
    expandedDesc += "â€¢ Strong problem-solving and communication skills\n";
    expandedDesc += "â€¢ Ability to deliver high-quality, well-documented code\n\n";
  }

  // 2. DELIVERABLES SECTION
  const hasDeliverables = text.includes("deliverable") || text.includes("output") || text.includes("deliver");
  if (!hasDeliverables) {
    expandedDesc += "Expected Deliverables:\n";
    
    if (projectCategory.includes("Web")) {
      expandedDesc += "â€¢ Fully functional web application with responsive design\n";
      expandedDesc += "â€¢ Clean, maintainable, well-documented source code\n";
      expandedDesc += "â€¢ Comprehensive testing and bug fixes\n";
    } else if (projectCategory.includes("Mobile")) {
      expandedDesc += "â€¢ Production-ready mobile application\n";
      expandedDesc += "â€¢ Complete source code with proper documentation\n";
      expandedDesc += "â€¢ Testing across multiple devices\n";
    } else if (projectCategory.includes("Backend")) {
      expandedDesc += "â€¢ Scalable backend architecture and database design\n";
      expandedDesc += "â€¢ Well-documented API with clear specifications\n";
      expandedDesc += "â€¢ Implementation and deployment support\n";
    } else {
      expandedDesc += "â€¢ Complete project deliverables as specified\n";
      expandedDesc += "â€¢ Full source code and documentation\n";
      expandedDesc += "â€¢ Quality assurance and testing\n";
    }
    
    expandedDesc += "â€¢ Ongoing support and maintenance as needed\n\n";
  }

  // 3. TIMELINE SECTION
  const hasTimeline = text.includes("timeline") || text.includes("deadline") || text.includes("when");
  if (!hasTimeline && timeline) {
    const estimatedTime = timeline[1] <= 7 ? "1-2 weeks" : 
                         timeline[1] <= 14 ? "2-4 weeks" : 
                         timeline[1] <= 30 ? "1-2 months" : "2+ months";
    expandedDesc += `Timeline:\nâ€¢ Project Duration: ${estimatedTime}\n`;
    expandedDesc += `â€¢ Estimated Completion: ${timeline[1]} days from start\n\n`;
  }

  // 4. PROFESSIONAL CLOSING
  expandedDesc += "What We Value:\n";
  expandedDesc += "â€¢ Attention to detail and quality craftsmanship\n";
  expandedDesc += "â€¢ Professional communication and regular updates\n";
  expandedDesc += "â€¢ Ability to meet deadlines and handle revisions\n";
  expandedDesc += "â€¢ Willingness to collaborate and iterate\n\n";

  expandedDesc += `We look forward to working with talented professionals who can bring expertise and dedication to this ${projectCategory.toLowerCase()} project. Please share your portfolio and relevant experience when submitting your proposal.`;

  // Ensure proper formatting
  if (!expandedDesc.endsWith(".")) {
    expandedDesc += ".";
  }

  // Limit to reasonable length (1500-2000 chars - enough for polished content)
  if (expandedDesc.length > 2000) {
    // Trim from middle sections to maintain structure
    expandedDesc = expandedDesc.substring(0, 1950).trim();
    // Find last complete line
    const lastNewline = expandedDesc.lastIndexOf("\n");
    if (lastNewline > 1800) {
      expandedDesc = expandedDesc.substring(0, lastNewline);
    }
    expandedDesc += "\n\n...";
  }

  return expandedDesc;
}

// â”€â”€ Improve project title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function improveTitle(title, description, skillsArray, complexityScore) {
  let improvedTitle = title.trim();

  // Capitalize properly
  improvedTitle = improvedTitle
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Add complexity indicator if missing and project is complex
  if (complexityScore >= 7 && !improvedTitle.toLowerCase().includes("develop") && 
      !improvedTitle.toLowerCase().includes("build") && !improvedTitle.toLowerCase().includes("create")) {
    // Check what type of project it is
    if (description.toLowerCase().includes("api") || description.toLowerCase().includes("backend")) {
      if (!improvedTitle.toLowerCase().includes("api")) {
        improvedTitle += " - API & Backend";
      }
    } else if (description.toLowerCase().includes("mobile") || description.toLowerCase().includes("app")) {
      if (!improvedTitle.toLowerCase().includes("app") && !improvedTitle.toLowerCase().includes("mobile")) {
        improvedTitle = "Build Mobile App: " + improvedTitle;
      }
    } else if (description.toLowerCase().includes("website") || description.toLowerCase().includes("web")) {
      if (!improvedTitle.toLowerCase().includes("website") && !improvedTitle.toLowerCase().includes("web")) {
        improvedTitle = "Build Website: " + improvedTitle;
      }
    }
  }

  // Ensure title is not too long (max 80 chars for clarity)
  if (improvedTitle.length > 80) {
    improvedTitle = improvedTitle.substring(0, 77) + "...";
  }

  // Ensure title is not too short
  if (improvedTitle.length < 10) {
    improvedTitle += " - " + skillsArray.slice(0, 2).join(" & ") || improvedTitle;
  }

  return improvedTitle;
}

// â”€â”€ Suggest improved skills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function suggestImprovedSkills(title, description, skillsArray, complexityScore) {
  const text = `${title} ${description}`.toLowerCase();
  const improvementMap = {
    // Frontend
    "react": ["React", "JavaScript", "UI/UX Design", "CSS"],
    "vue": ["Vue.js", "JavaScript", "UI/UX Design"],
    "angular": ["Angular", "TypeScript", "UI/UX Design"],
    "html": ["HTML", "CSS", "JavaScript", "Web Design"],
    "css": ["CSS", "HTML", "UI/UX Design"],

    // Backend
    "nodejs": ["Node.js", "Express.js", "REST APIs", "Database Design"],
    "node.js": ["Node.js", "Express.js", "REST APIs", "Database Design"],
    "python": ["Python", "Django", "Flask", "Database Design"],
    "java": ["Java", "Spring Boot", "REST APIs", "Database Design"],
    "php": ["PHP", "Laravel", "MySQL", "REST APIs"],
    "dotnet": [".NET", "C#", "SQL Server", "Azure"],
    "c#": ["C#", ".NET", "SQL Server"],

    // Database
    "mongodb": ["MongoDB", "NoSQL", "Database Design"],
    "mysql": ["MySQL", "SQL", "Database Design"],
    "postgresql": ["PostgreSQL", "SQL", "Database Design"],
    "firebase": ["Firebase", "Real-time Database", "Cloud Functions"],

    // DevOps/Tools
    "docker": ["Docker", "DevOps", "Kubernetes", "CI/CD"],
    "kubernetes": ["Kubernetes", "Docker", "DevOps", "Cloud Infrastructure"],
    "aws": ["AWS", "Cloud Services", "DevOps", "Scalability"],
    "git": ["Git", "GitHub", "Version Control"],

    // Mobile
    "react native": ["React Native", "Mobile Development", "JavaScript"],
    "flutter": ["Flutter", "Dart", "Mobile Development"],
    "swift": ["Swift", "iOS Development", "Xcode"],
    "kotlin": ["Kotlin", "Android Development", "Java"],

    // Specialized
    "machine learning": ["Machine Learning", "Python", "TensorFlow", "Data Analysis"],
    "ai": ["AI", "Machine Learning", "Python", "Data Science"],
    "blockchain": ["Blockchain", "Solidity", "Web3", "Smart Contracts"],
    "web3": ["Web3", "Blockchain", "Solidity", "Cryptocurrency"],
  };

  let suggestedSkills = [...skillsArray];

  // Check for each key and add related skills
  Object.entries(improvementMap).forEach(([key, relatedSkills]) => {
    if (text.includes(key)) {
      relatedSkills.forEach(skill => {
        if (!suggestedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
          suggestedSkills.push(skill);
        }
      });
    }
  });

  // Add generic skills based on complexity
  if (complexityScore >= 7) {
    const advancedSkills = ["Problem Solving", "System Design", "Code Review"];
    advancedSkills.forEach(skill => {
      if (!suggestedSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        suggestedSkills.push(skill);
      }
    });
  }

  // Remove duplicates (case-insensitive)
  suggestedSkills = [...new Set(suggestedSkills.map(s => s.toLowerCase()))].map(
    s => s.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  );

  // Limit to 6 skills
  return suggestedSkills.slice(0, 6);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN ESTIMATION ENDPOINT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.estimateProject = async (req, res) => {
  try {
    const { title, description, skills, experienceLevel } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    const skillsArray = Array.isArray(skills)
      ? skills
      : (skills || "").split(",").map((s) => s.trim()).filter(Boolean);

    // â”€â”€ Fetch platform data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ Run estimation algorithm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const complexityScore = analyzeProjectComplexity(title, description, skillsArray, experienceLevel);
    const timeline = estimateTimeline(complexityScore, experienceLevel);
    const { budgetMin, budgetMax } = estimateBudget(complexityScore, experienceLevel, marketData, skillsArray);
    const riskWarnings = generateRiskWarnings(budgetMin, budgetMax, complexityScore, timeline, experienceLevel);

    // â”€â”€ Improve all fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const suggestedTitle = improveTitle(title, description, skillsArray, complexityScore);
    const suggestedDescription = improveDescription(title, description, skillsArray, complexityScore, timeline);
    const suggestedSkills = suggestImprovedSkills(title, description, skillsArray, complexityScore);

    // â”€â”€ Determine confidence level â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let confidenceLevel = "Medium";
    if (similarProjects.length >= 3 || marketData.length >= 5) {
      confidenceLevel = "High"; // More data = more confidence
    } else if (similarProjects.length === 0 && marketData.length < 2) {
      confidenceLevel = "Low"; // Little data = less confident
    }

    // â”€â”€ Generate recommendation reasoning â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const reasoning =
      `Based on ${similarProjects.length} similar projects and ${marketData.length} market data points, ` +
      `this ${complexityScore <= 3 ? "simple" : complexityScore <= 6 ? "moderately complex" : "highly complex"} project ` +
      `is estimated at â‚¹${budgetMin}-${budgetMax} over ${timeline[0]}-${timeline[1]} days. ` +
      (avgMarketRate ? `Platform average is â‚¹${avgMarketRate}.` : "");

    // â”€â”€ Extract skills from description for suggestions â”€â”€â”€â”€â”€â”€â”€
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
      suggestedTitle,
      suggestedDescription,
      suggestedSkills,
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
    
    res.status(500).json({ message: err.message || "Estimation failed" });
  }
};

