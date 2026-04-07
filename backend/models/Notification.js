const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    {
    type: String,
    enum: ['appointment', 'queue', 'emergency', 'general', 'system'],
    default: 'general',
  },
  read:   { type: Boolean, default: false },
  link:   { type: String, default: null }, // optional deep link e.g. /status/:tokenId
}, { timestamps: true });

// Auto-delete notifications older than 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', NotificationSchema);
