const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, lowercase: true, trim: true },
  phone:          { type: String, trim: true },
  specialization: { type: String, required: true },
  hospitalId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isAvailable:    { type: Boolean, default: true },
  consultationFee: { type: Number, default: 0 },
  schedule: {
    monday:    { start: String, end: String, available: { type: Boolean, default: true } },
    tuesday:   { start: String, end: String, available: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
    thursday:  { start: String, end: String, available: { type: Boolean, default: true } },
    friday:    { start: String, end: String, available: { type: Boolean, default: true } },
    saturday:  { start: String, end: String, available: { type: Boolean, default: false } },
    sunday:    { start: String, end: String, available: { type: Boolean, default: false } },
  },
  avatar:         { type: String, default: null },
  totalPatients:  { type: Number, default: 0 },
  lastActivity:   { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
