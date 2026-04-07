const Notification = require('../models/Notification');
const { asyncHandler } = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

// Helper — emit a notification in real time via Socket.IO
const emitNotification = (io, userId, notification) => {
  if (io) {
    io.to(`user:${userId.toString()}`).emit('notification:new', notification);
  }
};

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const unreadCount = notifications.filter(n => !n.read).length;
  return success(res, { notifications, unreadCount });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) return error(res, 'Notification not found', 404);
  return success(res, { notification });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  return success(res, {}, 200, 'All notifications marked as read');
});

// Internal helper — create a notification and push it via socket
const createNotification = async (io, { userId, title, message, type = 'general', link = null }) => {
  try {
    const notification = await Notification.create({ user: userId, title, message, type, link });
    emitNotification(io, userId, notification);
    return notification;
  } catch (err) {
    console.error('[Notification] Failed to create:', err.message);
    return null;
  }
};

module.exports = { getNotifications, markRead, markAllRead, createNotification };
