const Project = require('../models/Project');
const Task = require('../models/Task');

const createProject = async (req, res) => {
  try {
    const { title, description, teamMembers } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required.' });
    }

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      teamMembers: teamMembers || [],
    });

    await project.populate('owner', 'name email avatar');
    await project.populate('teamMembers', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    console.error('[projectController.createProject]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error during project creation.' });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { teamMembers: req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate('teamMembers', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error('[projectController.getProjects]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('teamMembers', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isAuthorized = project.owner._id.toString() === req.user._id.toString() ||
      project.teamMembers.some(member => member._id.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this project.' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error('[projectController.getProjectById]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
};

const getProjectDashboard = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isAuthorized = project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.includes(req.user._id);

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this project.' });
    }

    const tasks = await Task.find({ projectId: req.params.id });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksByPriority = {
      Low: tasks.filter(task => task.priority === 'Low').length,
      Medium: tasks.filter(task => task.priority === 'Medium').length,
      High: tasks.filter(task => task.priority === 'High').length,
    };

    const tasksByStatus = {
      'To Do': tasks.filter(task => task.status === 'To Do').length,
      'In Progress': tasks.filter(task => task.status === 'In Progress').length,
      'Review': tasks.filter(task => task.status === 'Review').length,
      'Completed': completedTasks,
    };

    res.status(200).json({
      success: true,
      dashboard: {
        totalTasks,
        completedTasks,
        progressPercentage,
        tasksByPriority,
        tasksByStatus,
      },
    });
  } catch (error) {
    console.error('[projectController.getProjectDashboard]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project dashboard.' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { title, description, teamMembers } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only project owner can update the project.' });
    }

    if (title) project.title = title;
    if (description !== undefined) project.description = description;
    if (teamMembers) project.teamMembers = teamMembers;

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('teamMembers', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    console.error('[projectController.updateProject]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error during project update.' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only project owner can delete the project.' });
    }

    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project and associated tasks deleted successfully.',
    });
  } catch (error) {
    console.error('[projectController.deleteProject]', error);
    res.status(500).json({ success: false, message: 'Server error during project deletion.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  getProjectDashboard,
  updateProject,
  deleteProject,
};