const Groq = require("groq-sdk");
const Project = require("../models/Project");
const EscrowPayment = require("../models/EscrowPayment");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.estimateProject = async (req, res) => {
  try {
    const { title, description, skills, experienceLevel } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    const skillsArray = Array.isArray(skills)
      ? skills
      : (skills || "").split(",").map((s) => s.trim()).filter(Boolean);

    // ── Pull real DB data ─────────────────────────────────
    const titleWords = title.split(" ").filter((w) => w.length > 3);
    const titleRegex = titleWords.length > 0 ? new RegExp(titleWords.join("|"), "i") : /.*/;

    const similarProjects = await Project.find({
      $or: [{ title: titleRegex }, { skills: { $in: skillsArray } }, { description: titleRegex }],
    }).select("title budgetMin budgetMax deadline createdAt skills experienceLevel").limit(10).lean();

    const releasedEscrows = await EscrowPayment.find({ status: "Released" })
      .populate("projectId", "title skills budgetMin budgetMax experienceLevel")
      .sort({ createdAt: -1 }).limit(20).lean();

    const marketData = releasedEscrows.filter((e) => e.projectId).map((e) => ({
      amount: e.amount,
      skills: e.projectId.skills,
      experienceLevel: e.projectId.experienceLevel,
    }));

    const avgMarketRate = marketData.length > 0
      ? Math.round(marketData.reduce((s, e) => s + e.amount, 0) / marketData.length)
      : null;

    const similarData = similarProjects.map((p) => ({
      title: p.title,
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      skills: p.skills,
      experienceLevel: p.experienceLevel,
      durationDays: p.deadline && p.createdAt
        ? Math.ceil((new Date(p.deadline) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24))
        : null,
    }));

    // ── Build prompt ──────────────────────────────────────
    const prompt = `You are an expert freelance project cost and timeline estimator for TaskHive, a freelance platform operating in Nepal (currency: NPR ₹).

Analyze this project and provide a detailed estimation:

PROJECT DETAILS:
- Title: ${title}
- Description: ${description}
- Required Skills: ${skillsArray.join(", ") || "Not specified"}
- Experience Level: ${experienceLevel || "Not specified"}

REAL PLATFORM DATA:
- Average payment on platform: ${avgMarketRate ? `₹${avgMarketRate}` : "No data yet"}
- Similar past projects: ${similarData.length > 0 ? JSON.stringify(similarData) : "None found"}
- Recent completed projects: ${marketData.length > 0 ? JSON.stringify(marketData.slice(0, 5)) : "No data"}

Respond with ONLY a valid JSON object, no markdown, no explanation, no code fences:
{"budgetMin":number,"budgetMax":number,"timelineMin":number,"timelineMax":number,"recommendedExperienceLevel":"Beginner or Intermediate or Expert","complexityScore":number between 1-10,"confidenceLevel":"Low or Medium or High","riskWarnings":["warning1","warning2"],"reasoning":"2-3 sentence explanation","suggestedSkills":["skill1","skill2"]}

Rules:
- Budget in NPR, realistic for Nepal freelance market
- Weight platform data heavily if available
- Risk warnings: flag low budget, complexity mismatch, tight timeline
- Max 3 risk warnings`;

    // ── Call Groq API ─────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens:  1024,
    });

    const rawText = completion.choices[0]?.message?.content?.trim() || "";

    // ── Parse response ────────────────────────────────────
    let estimation;
    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      estimation = JSON.parse(clean);
    } catch {
      console.error("Groq raw response:", rawText);
      return res.status(500).json({ message: "AI returned invalid response. Please try again." });
    }

    res.json({
      estimation,
      meta: {
        similarProjectsFound: similarData.length,
        marketDataPoints:     marketData.length,
        avgMarketRate,
        poweredBy:            "Groq (Llama 3)",
      },
    });

  } catch (err) {
    console.error("estimateProject error:", err);
    res.status(500).json({ message: err.message || "Estimation failed" });
  }
};