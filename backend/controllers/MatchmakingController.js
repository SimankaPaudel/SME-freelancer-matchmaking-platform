const User = require("../models/User");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const Notification = require("../models/Notification");

// ──────────────────────────────────────────────────────────────────────────
// FREELANCER MATCHMAKING ENGINE
// Finds best matching freelancers for a project based on skills, experience, 
// ratings, and other criteria
// ──────────────────────────────────────────────────────────────────────────

// ── Calculate skill match score ───────────────────────────────────────
function calculateSkillMatchScore(freelancerSkills, projectSkills) {
  if (!projectSkills || projectSkills.length === 0) return 0;
  if (!freelancerSkills || freelancerSkills.length === 0) return 0;

  // Skill synonyms/categories for semantic matching
  const skillAliases = {
    'react': ['react', 'reactjs', 'react.js'],
    'node.js': ['node', 'nodejs', 'node.js'],
    'javascript': ['javascript', 'js', 'javascript/typescript'],
    'html': ['html', 'html5'],
    'css': ['css', 'css3'],
    'mongodb': ['mongodb', 'mongo', 'nosql', 'database'],
    'mysql': ['mysql', 'sql', 'database'],
    'express': ['express', 'expressjs', 'express.js'],
    'rest api': ['api', 'rest', 'rest api', 'restful', 'http'],
    'java': ['java', 'javase', 'j2ee'],
    'python': ['python', 'python 3', 'py'],
    'figma': ['figma', 'ui design', 'design'],
    'git': ['git', 'github', 'gitlab', 'version control'],
  };

  // Normalize skill to its canonical form
  function normalizeSkill(skill) {
    const skillLower = skill.toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(skillAliases)) {
      if (aliases.includes(skillLower)) return canonical;
    }
    return skillLower;
  }

  const freelancerNormalized = new Set(freelancerSkills.map(normalizeSkill));
  const projectNormalized = projectSkills.map(normalizeSkill);

  // Count exact matches after normalization
  const matches = projectNormalized.filter(skill => freelancerNormalized.has(skill)).length;

  // Calculate match percentage
  const matchScore = (matches / projectSkills.length) * 100;
  return Math.min(matchScore, 100); // Cap at 100
}

// ── Calculate experience level match ──────────────────────────────────
function calculateExperienceLevelScore(freelancerProfile, projectExperienceLevel) {
  // Check if freelancer has enough projects or history to indicate experience
  const completedProposals = freelancerProfile.completedProposals || 0;
  const totalReviews = freelancerProfile.totalReviews || 0;
  const averageRating = freelancerProfile.averageRating || 0;

  // Infer freelancer experience from profile data
  let freelancerLevel = "Beginner";
  if (totalReviews >= 10 && averageRating >= 4.5) {
    freelancerLevel = "Expert";
  } else if (totalReviews >= 5 && averageRating >= 4.0) {
    freelancerLevel = "Intermediate";
  }

  // Score based on match
  const levelHierarchy = { "Beginner": 1, "Intermediate": 2, "Expert": 3 };
  const projectLevel = levelHierarchy[projectExperienceLevel] || 2;
  const freelancerLevelScore = levelHierarchy[freelancerLevel] || 1;

  // Freelancer should be at or above required level
  if (freelancerLevelScore >= projectLevel) {
    return 100; // Perfect match
  } else if (freelancerLevelScore === projectLevel - 1) {
    return 70; // One level below, but still acceptable
  } else {
    return 40; // Below required level
  }
}

// ── Calculate rating score ────────────────────────────────────────────
function calculateRatingScore(averageRating, totalReviews) {
  // Weight rating higher if more reviews
  if (totalReviews === 0) return 50; // New freelancer
  if (totalReviews < 3) return (averageRating / 5) * 70; // Few reviews
  if (totalReviews < 10) return (averageRating / 5) * 85; // Some reviews
  
  // Established freelancer
  return (averageRating / 5) * 100;
}

// ── Calculate budget compatibility score ───────────────────────────────
function calculateBudgetScore(freelancerRate, projectBudgetMin, projectBudgetMax, projectDays) {
  // Estimate project rate from hourly rate (assuming 8 hours per day)
  if (!freelancerRate || freelancerRate === 0) return 60; // No rate specified
  
  // Calculate if freelancer's rate fits within budget
  const dailyRate = freelancerRate * 8; // 8 hours per day
  const estimatedProjectCost = dailyRate * projectDays;

  if (estimatedProjectCost <= projectBudgetMax) {
    // Fits within budget
    if (estimatedProjectCost >= projectBudgetMin) {
      return 100; // Perfect fit
    } else {
      return 90; // Below minimum but still good value
    }
  } else if (estimatedProjectCost <= projectBudgetMax * 1.2) {
    return 70; // Slightly over budget
  } else {
    return 40; // Significantly over budget
  }
}

// ── Calculate overall match score ─────────────────────────────────────
function calculateOverallMatchScore(metrics) {
  // Weighted scoring
  const weights = {
    skillMatch: 0.40,       // 40% - Skills most important
    experienceLevel: 0.20,  // 20% - Experience requirement
    rating: 0.20,           // 20% - Quality/reliability
    budget: 0.15,           // 15% - Budget fit
    availability: 0.05,     // 5% - Availability
  };

  const overallScore =
    (metrics.skillMatch * weights.skillMatch) +
    (metrics.experienceLevel * weights.experienceLevel) +
    (metrics.rating * weights.rating) +
    (metrics.budget * weights.budget) +
    (metrics.availability * weights.availability);

  return Math.round(overallScore);
}

exports.test = async(req, res) => {
  return res.json({ message: "Matchmaking engine is working!" });
}

// ── Get matching freelancers for a project ──────────────────────────────
exports.getMatchingFreelancers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = req.query.limit || 10;
    const minMatchScore = req.query.minScore || 40;

    // Fetch project
    const project = await Project.findById(projectId)
      .populate("postedBy", "companyName -_id")
      .lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get project details for calculation
    const projectSkills = project.skills || [];
    const projectExperienceLevel = project.experienceLevel || "Intermediate";
    const projectBudgetMax = project.budgetMax || 50000;
    const projectBudgetMin = project.budgetMin || 5000;

    // Calculate estimated project duration in days
    const deadline = new Date(project.deadline);
    const now = new Date();
    const projectDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    const estimatedDays = Math.max(projectDays, 7); // Min 7 days

    // Get all active freelancers
    const freelancers = await User.find({
      role: "Freelancer",
      isActive: true,
      isEmailVerified: true,
      kycStatus: "Approved",
    })
      .select("firstName lastName fullName skills hourlyRate projectRate bio averageRating totalReviews portfolio weeklyAvailability")
      .lean();

    // Calculate match scores for each freelancer
    const matches = freelancers
      .map(freelancer => {
        // Get completed projects/proposals from profile (rough estimate from reviews)
        const completedProposals = freelancer.totalReviews || 0;

        // Calculate individual scores
        const skillMatch = calculateSkillMatchScore(freelancer.skills, projectSkills);
        const experienceLevel = calculateExperienceLevelScore(
          { totalReviews: freelancer.totalReviews, averageRating: freelancer.averageRating },
          projectExperienceLevel
        );
        const rating = calculateRatingScore(freelancer.averageRating, freelancer.totalReviews);
        const budget = calculateBudgetScore(
          freelancer.hourlyRate,
          projectBudgetMin,
          projectBudgetMax,
          estimatedDays
        );
        const availability = Math.min(Math.max((freelancer.weeklyAvailability || 0), 0) / 40 * 100, 100) || 50;

        // Calculate overall match
        const overallScore = calculateOverallMatchScore({
          skillMatch,
          experienceLevel,
          rating,
          budget,
          availability,
        });

        return {
          id: freelancer._id,
          name: freelancer.fullName,
          title: freelancer.skills?.slice(0, 3).join(", ") || "Freelancer",
          skills: freelancer.skills,
          bio: freelancer.bio,
          hourlyRate: freelancer.hourlyRate,
          projectRate: freelancer.projectRate,
          averageRating: freelancer.averageRating,
          totalReviews: freelancer.totalReviews,
          portfolioCount: freelancer.portfolio?.length || 0,
          weeklyAvailability: freelancer.weeklyAvailability,
          matchMetrics: {
            skillMatch: Math.round(skillMatch),
            experienceLevel: Math.round(experienceLevel),
            rating: Math.round(rating),
            budget: Math.round(budget),
            availability: Math.round(availability),
          },
          overallMatch: overallScore,
        };
      })
      .filter(match => match.overallMatch >= minMatchScore)
      .sort((a, b) => b.overallMatch - a.overallMatch)
      .slice(0, limit);

    // Check if each freelancer has already submitted a proposal for this project
    const matchesWithProposalStatus = await Promise.all(
      matches.map(async (match) => {
        const existingProposal = await Proposal.findOne({
          projectId: projectId,
          freelancerId: match.id,
        }).select("_id bidAmount proposalText status");

        return {
          ...match,
          hasProposal: !!existingProposal,
          proposalDetails: existingProposal ? {
            id: existingProposal._id,
            bidAmount: existingProposal.bidAmount,
            status: existingProposal.status,
          } : null,
        };
      })
    );

    // Get statistics
    const statistics = {
      totalFreelancersInPool: freelancers.length,
      matchesFound: matches.length,
      averageMatchScore: matches.length > 0
        ? Math.round(matches.reduce((sum, m) => sum + m.overallMatch, 0) / matches.length)
        : 0,
      topMatch: matches[0]?.overallMatch || 0,
    };

    res.json({
      project: {
        id: project._id,
        title: project.title,
        skills: projectSkills,
        experienceLevel: projectExperienceLevel,
        budgetRange: `${projectBudgetMin} - ${projectBudgetMax}`,
        deadline: project.deadline,
      },
      matches: matchesWithProposalStatus,
      statistics,
      message: `Found ${matches.length} qualified freelancer${matches.length !== 1 ? "s" : ""} for this project`,
    });
  } catch (err) {
    console.error("getMatchingFreelancers error:", err);
    res.status(500).json({ message: err.message || "Failed to find matching freelancers" });
  }
};

// ── Send invite to freelancer for a project ──────────────────────────────
exports.sendInvite = async (req, res) => {
  try {
    const { projectId, freelancerId, message } = req.body;
    
    console.log("[DEBUG] sendInvite DEBUG:");
    console.log("  req.user:", req.user);
    console.log("  req.user keys:", req.user ? Object.keys(req.user) : "undefined");

    const smeId = req.user?.userId;
    
    console.log("  smeId:", smeId);
    console.log("  projectId:", projectId);
    console.log("  freelancerId:", freelancerId);

    if (!smeId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    // Validate inputs
    if (!projectId || !freelancerId) {
      return res.status(400).json({ message: "Project ID and Freelancer ID required" });
    }

    // Fetch project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    console.log("  project.postedBy:", project.postedBy, typeof project.postedBy);

    // Verify SME owns this project
    if (project.postedBy.toString() !== smeId.toString()) {
      console.log("❌ Ownership check failed!");
      console.log("  project.postedBy.toString():", project.postedBy.toString());
      console.log("  smeId.toString():", smeId.toString());
      return res.status(403).json({ message: "Unauthorized: You don't own this project" });
    }

    // Check if freelancer already has a proposal for this project
    const existingProposal = await Proposal.findOne({
      projectId: projectId,
      freelancerId: freelancerId,
    });

    if (existingProposal) {
      return res.status(400).json({ message: "Freelancer already has a proposal for this project" });
    }

    // Fetch freelancer
    const freelancer = await User.findById(freelancerId);
    if (!freelancer || freelancer.role !== "Freelancer") {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    // Fetch SME details
    const sme = await User.findById(smeId);

    // Create notification for freelancer
    const notificationMessage = `${sme.fullName} invited you to work on "${project.title}"`;
    
    const notification = new Notification({
      userId: freelancerId,
      type: "project_invite",
      title: "Project Invitation",
      message: notificationMessage,
      projectId: projectId,
      relatedUserId: smeId,
      link: `/dashboard/project/${projectId}`,
      data: {
        projectTitle: project.title,
        projectBudget: `${project.budgetMin} - ${project.budgetMax}`,
        customMessage: message || "",
      },
    });

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Invite sent successfully",
      notification: notification,
    });
  } catch (err) {
    console.error("sendInvite error:", err);
    res.status(500).json({ message: err.message || "Failed to send invite" });
  }
};

// ── Get matching projects for a freelancer ──────────────────────────────
exports.getMatchingProjects = async (req, res) => {
  try {
    const freelancerId = req.user.userId;
    const limit = req.query.limit || 10;
    const minMatchScore = req.query.minScore || 40;

    // Fetch freelancer profile
    const freelancer = await User.findById(freelancerId)
      .select("skills hourlyRate averageRating totalReviews weeklyAvailability role")
      .lean();

    console.log("\n========== MATCHING PROJECTS CALCULATION ==========");
    console.log("[INFO] Fetching freelancer with ID:", freelancerId);
    console.log("Freelancer found:", !!freelancer);
    if (freelancer) {
      console.log("Freelancer details:", { 
        id: freelancerId, 
        role: freelancer.role,
        skills: freelancer.skills, 
        hourlyRate: freelancer.hourlyRate,
        availability: freelancer.weeklyAvailability,
        rating: freelancer.averageRating,
        reviews: freelancer.totalReviews
      });
    }
    console.log("Query params: limit=" + limit + ", minScore=" + minMatchScore);

    if (!freelancer) {
      console.error("[ERROR] Freelancer NOT FOUND in database!");
      return res.status(404).json({ message: "Freelancer profile not found" });
    }
    if (freelancer.role !== "Freelancer") {
      console.error("[ERROR] User is not a Freelancer, role is:", freelancer.role);
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    // Get all open projects
    const projects = await Project.find({ status: "Open" })
      .populate("postedBy", "companyName -_id")
      .lean();

    console.log(`\n[INFO] Found ${projects.length} OPEN projects in database`);
    if (projects.length === 0) {
      console.log("[WARNING] NO OPEN PROJECTS FOUND!");
      console.log("[INFO] RETURNING EMPTY MATCHES - NO PROJECTS TO MATCH");
      return res.json({
        freelancer: {
          id: freelancer._id,
          skills: freelancer.skills,
          hourlyRate: freelancer.hourlyRate,
          averageRating: freelancer.averageRating,
        },
        matches: [],
        statistics: {
          totalProjectsAvailable: 0,
          matchesFound: 0,
          averageMatchScore: 0,
          topMatch: 0,
        },
        message: "No projects available at the moment",
      });
    }
    console.log("✅ Projects found - proceeding with scoring...\n");

    // Calculate match scores for each project
    const matches = projects
      .map(project => {
        const projectSkills = project.skills || [];

        // Calculate individual scores
        const skillMatch = calculateSkillMatchScore(freelancer.skills, projectSkills);
        const experienceLevel = calculateExperienceLevelScore(
          { totalReviews: freelancer.totalReviews, averageRating: freelancer.averageRating },
          project.experienceLevel
        );
        const rating = calculateRatingScore(freelancer.averageRating, freelancer.totalReviews);
        
        // Calculate project duration for accurate budget scoring
        const projectDeadline = new Date(project.deadline);
        const now = new Date();
        const projectDays = Math.ceil((projectDeadline - now) / (1000 * 60 * 60 * 24));
        const estimatedDays = Math.max(projectDays, 7); // Min 7 days

        const budget = calculateBudgetScore(
          freelancer.hourlyRate,
          project.budgetMin,
          project.budgetMax,
          estimatedDays
        );
        const availability = Math.min(Math.max((freelancer.weeklyAvailability || 0), 0) / 40 * 100, 100) || 50;

        // Calculate overall match
        const overallScore = calculateOverallMatchScore({
          skillMatch,
          experienceLevel,
          rating,
          budget,
          availability,
        });

        if (project.title.includes("Dashboard")) {
          console.log("  [STATS] Dashboard Project Match Score Breakdown:");
          console.log("    Skill Match: " + skillMatch + "%");
          console.log("    Experience Level: " + experienceLevel + "%");
          console.log("    Rating: " + rating + "%");
          console.log("    Budget: " + budget + "%");
          console.log("    Availability: " + availability + "%");
          console.log("    [SCORE] OVERALL SCORE: " + Math.round(overallScore) + "% (minThreshold: " + minMatchScore + "%)");
          console.log("    Pass Filter? " + (overallScore >= minMatchScore ? "[PASS] YES" : "[FAIL] NO - FILTERED OUT"));
        }

        return {
          id: project._id,
          title: project.title,
          description: project.description || "Project details",
          skills: projectSkills,
          experienceLevel: project.experienceLevel,
          budgetRange: `₹${project.budgetMin} - ₹${project.budgetMax}`,
          deadline: project.deadline,
          postedBy: project.postedBy?.companyName || "Unknown",
          matchMetrics: {
            skillMatch: Math.round(skillMatch),
            experienceLevel: Math.round(experienceLevel),
            rating: Math.round(rating),
            budget: Math.round(budget),
            availability: Math.round(availability),
          },
          overallMatch: overallScore,
        };
      })
      .filter(match => match.overallMatch >= minMatchScore)
      .sort((a, b) => b.overallMatch - a.overallMatch)
      .slice(0, limit);

    console.log("  matches after filtering:", matches.length);
    console.log("  minMatchScore:", minMatchScore);
    console.log("  Filtered matches:", matches.map(m => ({ title: m.title, score: Math.round(m.overallMatch) })));

    // Exclude projects where freelancer already has a proposal
    const matchesWithoutExisting = await Promise.all(
      matches.map(async (match) => {
        const existingProposal = await Proposal.findOne({
          projectId: match.id,
          freelancerId: freelancerId,
        }).select("_id status bidAmount");

        const result = {
          ...match,
          hasExistingProposal: !!existingProposal,
          proposalStatus: existingProposal?.status,
          proposalBid: existingProposal?.bidAmount,
        };
        
        if (existingProposal) {
          console.log(`  ✓ ${match.title}: Already has proposal (status: ${existingProposal.status})`);
        } else {
          console.log(`  ○ ${match.title}: No existing proposal`);
        }
        
        return result;
      })
    );

    // Filter out projects with existing proposals
    const finalMatches = matchesWithoutExisting;

    console.log("\n[RESULTS] FINAL RESULTS:");
    console.log("  ✓ Total matches after scoring (before proposal check): " + matches.length);
    console.log("  ✓ Final matches to return (with proposal status): " + finalMatches.length);
    console.log("  Projects in final response:", finalMatches.map(m => ({ 
      title: m.title, 
      score: Math.round(m.overallMatch),
      hasProposal: m.hasExistingProposal
    })));

    // Get statistics
    const statistics = {
      totalProjectsAvailable: projects.length,
      matchesFound: finalMatches.length,
      averageMatchScore: finalMatches.length > 0
        ? Math.round(finalMatches.reduce((sum, m) => sum + m.overallMatch, 0) / finalMatches.length)
        : 0,
      topMatch: finalMatches[0]?.overallMatch || 0,
    };

    console.log("[INFO] RESPONSE BEING SENT:");
    console.log("  finalMatches count:", finalMatches.length);
    console.log("  finalMatches details:", finalMatches.map(m => ({ title: m.title, score: m.overallMatch })));
    console.log("[INFO] getMatchingProjects FINISHED ===============\n");

    res.json({
      freelancer: {
        id: freelancer._id,
        skills: freelancer.skills,
        hourlyRate: freelancer.hourlyRate,
        averageRating: freelancer.averageRating,
      },
      matches: finalMatches,
      statistics,
      message: `Found ${finalMatches.length} suitable project${finalMatches.length !== 1 ? "s" : ""} for your profile`,
    });
  } catch (err) {
    console.error("getMatchingProjects error:", err);
    res.status(500).json({ message: err.message || "Failed to find matching projects" });
  }
};
