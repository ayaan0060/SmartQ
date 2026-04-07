const Task          = require('../models/Task');
const StaffSchedule = require('../models/StaffSchedule');
const Announcement  = require('../models/Announcement');
const { asyncHandler: catchAsync, AppError } = require('../utils/asyncHandler');

// ── GET /api/staff-portal/tasks ─────────────────────────────────────────────
// Returns tasks assigned to the logged-in staff user.
// Optionally filters to today when ?today=true (default: all tasks)
const getMyTasks = catchAsync(async (req, res) => {
  const filter = { assignedTo: req.user._id };

  if (req.query.today === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  const tasks = await Task.find(filter)
    .populate('assignedBy', 'name role')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  res.json({ success: true, data: tasks });
});

// ── PATCH /api/staff-portal/tasks/:id/status ────────────────────────────────
const updateTaskStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const allowed = ['in_progress', 'completed'];
  if (!allowed.includes(status)) {
    throw new AppError('Invalid status. Must be in_progress or completed.', 400);
  }

  const task = await Task.findOne({ _id: req.params.id, assignedTo: req.user._id });
  if (!task) throw new AppError('Task not found or not assigned to you.', 404);

  task.status = status;
  await task.save();

  res.json({ success: true, data: task });
});

// ── GET /api/staff-portal/schedule ──────────────────────────────────────────
const getMySchedule = catchAsync(async (req, res) => {
  const schedule = await StaffSchedule.findOne({ staff: req.user._id })
    .lean();

  res.json({ success: true, data: schedule || null });
});

// ── GET /api/staff-portal/announcements ─────────────────────────────────────
const getAnnouncements = catchAsync(async (req, res) => {
  const hospitalId = req.user.hospitalId;
  if (!hospitalId) throw new AppError('Hospital not assigned to user.', 400);

  const announcements = await Announcement.find({
    hospital: hospitalId,
    isActive: true,
    $or: [
      { targetRoles: { $in: ['all', req.user.role] } },
      { targetRoles: { $size: 0 } },
    ],
  })
    .populate('postedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  // Annotate each announcement with isRead flag for this user
  const userId = req.user._id.toString();
  const result = announcements.map(a => ({
    ...a,
    isRead: (a.readBy || []).some(id => id.toString() === userId),
  }));

  res.json({ success: true, data: result });
});

// ── PATCH /api/staff-portal/announcements/:id/read ──────────────────────────
const markAnnouncementRead = catchAsync(async (req, res) => {
  const announcement = await Announcement.findOne({
    _id: req.params.id,
    hospital: req.user.hospitalId,
  });
  if (!announcement) throw new AppError('Announcement not found.', 404);

  const alreadyRead = announcement.readBy.some(
    id => id.toString() === req.user._id.toString()
  );
  if (!alreadyRead) {
    announcement.readBy.push(req.user._id);
    await announcement.save();
  }

  res.json({ success: true, message: 'Marked as read.' });
});

module.exports = {
  getMyTasks,
  updateTaskStatus,
  getMySchedule,
  getAnnouncements,
  markAnnouncementRead,
};
