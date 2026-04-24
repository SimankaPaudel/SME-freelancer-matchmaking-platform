const Project = require("../models/Project");
const { createNotification } = require("../utils/notificationHelper");

exports.createProject = async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== "sme")
      return res.status(403).json({ message: "Only SMEs can post projects" });

    // Check KYC verification
    const user = await require("../models/User").findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.kycStatus !== "Approved")
      return res.status(403).json({ message: "KYC verification is required before posting projects. Please complete your KYC verification." });

    const project = await Project.create({
      title:           req.body.title,
      description:     req.body.description,
      skills:          req.body.skills,
      experienceLevel: req.body.experienceLevel,
      budgetMin:       req.body.budgetMin,
      budgetMax:       req.body.budgetMax,
      deadline:        req.body.deadline,
      postedBy:        req.user.userId,
      status:          "Open",
    });
    
    // Create notification for SME's own projects (optional - they know they posted it)
    // Could notify freelancers with matching skills in future
    
    res.status(201).json(project);
  } catch (err) {
    
    res.status(500).json({ message: "Failed to create project" });
  }
};

exports.getOpenProjects = async (req, res) => {
  try {
    const query = { status: "Open" };

    // Global search - search in title and description
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Skill filter
    if (req.query.skill)
      query.skills = { $regex: req.query.skill, $options: "i" };

    // Budget filters
    if (req.query.minBudget)
      query.budgetMin = { $gte: Number(req.query.minBudget) };
    if (req.query.maxBudget)
      query.budgetMax = { $lte: Number(req.query.maxBudget) };

    // Experience level filter
    if (req.query.experienceLevel)
      query.experienceLevel = req.query.experienceLevel;

    // Deadline within N days
    if (req.query.deadlineDays) {
      const days  = Number(req.query.deadlineDays);
      const limit = new Date();
      limit.setDate(limit.getDate() + days);
      query.deadline = { $lte: limit, $gte: new Date() };
    }

    const projects = await Project.find(query)
      .populate("postedBy", "fullName email _id companyName")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ postedBy: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Failed to load your projects" });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate("postedBy", "fullName email _id companyName description industryType website");
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  } catch (err) {
    
    res.status(500).json({ message: "Failed to fetch project" });
  }
};

exports.extendDeadline = async (req, res) => {
  try {
    const { newDeadline } = req.body;
    if (!newDeadline) return res.status(400).json({ message: "New deadline required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.postedBy.equals(req.user.userId))
      return res.status(403).json({ message: "Unauthorized" });

    project.deadline = new Date(newDeadline);
    await project.save();
    
    // Notify interested freelancers about deadline change
    const Proposal = require("../models/Proposal");
    const proposals = await Proposal.find({ projectId: project._id, status: { $in: ["Submitted", "Shortlisted"] } });
    
    for (const prop of proposals) {
      await createNotification({
        userId: prop.freelancerId,
        title: "Project Deadline Extended",
        message: `The deadline for "${project.title}" has been extended to ${new Date(newDeadline).toLocaleDateString()}`,
        type: "general",
        link: `/dashboard/browse-projects/${project._id}`,
      });
    }
    
    res.json({ message: "Deadline updated", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.postedBy.toString() !== req.user.userId)
      return res.status(403).json({ message: "Unauthorized" });

    project.status = status;
    await project.save();    
    // Notify freelancers with proposals if project status changes
    if (status === "Closed") {
      const Proposal = require("../models/Proposal");
      const proposals = await Proposal.find({ projectId: project._id });
      
      for (const prop of proposals) {
        if (prop.status !== "Accepted") {
          await createNotification({
            userId: prop.freelancerId,
            title: "Project Closed",
            message: `The project "${project.title}" has been closed and is no longer accepting proposals`,
            type: "general",
            link: "/dashboard/browse-projects",
          });
        }
      }
    }
    
    res.json({ message: "Project status updated", project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { title, description, skills, experienceLevel, budgetMin, budgetMax, deadline } = req.body;

    // Validate required fields
    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });
    if (!description || !description.trim()) return res.status(400).json({ message: "Description is required" });
    if (!experienceLevel) return res.status(400).json({ message: "Experience level is required" });
    if (budgetMin === undefined || budgetMin === null) return res.status(400).json({ message: "Minimum budget is required" });
    if (budgetMax === undefined || budgetMax === null) return res.status(400).json({ message: "Maximum budget is required" });
    if (budgetMin > budgetMax) return res.status(400).json({ message: "Minimum budget cannot exceed maximum budget" });
    if (!deadline) return res.status(400).json({ message: "Deadline is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    
    // Only project owner can edit
    if (!project.postedBy.equals(req.user.userId))
      return res.status(403).json({ message: "Only project owner can edit" });

    // Update fields
    project.title = title.trim();
    project.description = description.trim();
    project.skills = skills && Array.isArray(skills) ? skills : [];
    project.experienceLevel = experienceLevel;
    project.budgetMin = Number(budgetMin);
    project.budgetMax = Number(budgetMax);
    project.deadline = new Date(deadline);

    await project.save();
    res.json({ message: "Project updated successfully", project });
  } catch (err) {
    
    res.status(500).json({ message: err.message || "Failed to update project" });
  }
};