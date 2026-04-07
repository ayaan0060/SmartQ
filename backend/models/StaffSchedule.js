const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['morning', 'evening', 'night', 'off'],
    required: true,
  },
  ward:      { type: String, trim: true, default: '' },
  startTime: { type: String, trim: true, default: '' },
  endTime:   { type: String, trim: true, default: '' },
}, { _id: false });

const StaffScheduleSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  shifts: [ShiftSchema],
}, { timestamps: true });

StaffScheduleSchema.index({ hospital: 1 });

module.exports = mongoose.model('StaffSchedule', StaffScheduleSchema);
