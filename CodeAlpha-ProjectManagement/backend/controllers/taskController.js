const Task = require('../models/Task');
const Project = require('../models/Project');

const validateDueDate = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(dueDate);
  return dateToCheck >= today;
};

const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

    if (!title || !projectId || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title, project ID, and due date are required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isAuthorized = project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.includes(req.user._id);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this project.' });
    }

    if (!validateDueDate(dueDate)) {
      return res.status(400).json({ success: false, message: 'Due date cannot be in the past.' });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || [],
      priority: priority || 'Medium',
      status: status || 'To Do',
      dueDate,
    });

    await task.populate('projectId', 'title');
    await task.populate('assignedTo', 'name email avatar');

    // Emit socket event
    if (req.io) {
      req.io.emit('taskCreated', { task, projectId });
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task,
    });
  } catch (error) {
    console.error('[taskController.createTask]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error during task creation.' });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const isAuthorized = project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.includes(req.user._id);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this project.' });
    }

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('projectId', 'title')
      .populate('assignedTo', 'name email avatar')
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error('[taskController.getTasksByProject]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks.' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;
    const task = await Task.findById(req.params.id).populate('projectId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const project = task.projectId;
    const isAuthorized = project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.includes(req.user._id);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this task.' });
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate) {
      if (!validateDueDate(dueDate)) {
        return res.status(400).json({ success: false, message: 'Due date cannot be in the past.' });
      }
      task.dueDate = dueDate;
    }

    await task.save();
    await task.populate('projectId', 'title');
    await task.populate('assignedTo', 'name email avatar');

    // Emit socket event
    if (req.io) {
      req.io.emit('taskUpdated', { task, projectId: task.projectId._id.toString() });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task,
    });
  } catch (error) {
    console.error('[taskController.updateTask]', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    res.status(500).json({ success: false, message: 'Server error during task update.' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('projectId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const project = task.projectId;
    const isAuthorized = project.owner.toString() === req.user._id.toString() ||
      project.teamMembers.includes(req.user._id);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Access denied to this task.' });
    }

    await Task.findByIdAndDelete(req.params.id);

    // Emit socket event
    if (req.io) {
      req.io.emit('taskDeleted', { taskId: req.params.id, projectId: task.projectId._id.toString() });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error) {
    console.error('[taskController.deleteTask]', error);
    res.status(500).json({ success: false, message: 'Server error during task deletion.' });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
};