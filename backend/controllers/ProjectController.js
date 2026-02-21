const Project = require("../models/Project");

// Create project
exports.createProject = async (req, res) => {
  try {
    if (req.user.role?.toLowerCase() !== "sme") {
      return res.status(403).json({ message: "Only SMEs can post projects" });
    }
    const project = await Project.create({
      title: req.body.title,
      description: req.body.description,
      skills: req.body.skills,
      experienceLevel: req.body.experienceLevel,
      budgetMin: req.body.budgetMin,
      budgetMax: req.body.budgetMax,
      deadline: req.body.deadline,
      postedBy: req.user.userId,
      status: "Open",
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create project" });
  }
};

exports.getOpenProjects = async (req, res) => {
  try {
    const query = { status: "Open" };
    if (req.query.skill) query.skills = { $regex: req.query.skill, $options: "i" };
    if (req.query.minBudget) query.budgetMin = { $gte: Number(req.query.minBudget) };
    if (req.query.deadline) query.deadline = { $lte: new Date(req.query.deadline) };

    const projects = await Project.find(query).populate("postedBy", "fullName email");
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ postedBy: req.user.userId });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load your projects" });
  }
};

exports.extendDeadline = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDeadline } = req.body;
    if (!newDeadline) return res.status(400).json({ message: "New deadline required" });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.postedBy.equals(req.user.userId))
      return res.status(403).json({ message: "Unauthorized" });

    project.deadline = new Date(newDeadline);
    await project.save();
    res.json({ message: "Deadline updated", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.postedBy.toString() !== req.user.userId)
      return res.status(403).json({ message: "Unauthorized" });

    project.status = status;
    await project.save();
    res.json({ message: "Status updated", project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
