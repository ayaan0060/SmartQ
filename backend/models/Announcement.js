const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  priority: {
    type: String,
    enum: ['normal', 'important'],
    default: 'normal',
  },
  // Array of user IDs who have read this announcement
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  targetRoles: [{
    type: String,
    enum: ['staff', 'nurse', 'receptionist', 'doctor', 'all'],
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AnnouncementSchema.index({ hospital: 1, createdAt: -1 });
AnnouncementSchema.index({ hospital: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
