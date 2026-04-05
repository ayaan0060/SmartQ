const mongoose = require('mongoose');

const ConsultationLogSchema = new mongoose.Schema({
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  serviceId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  tokenId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true },
  patientType: {
    type: String,
    enum: ['new', 'follow-up', 'emergency', 'standard'],
    default: 'standard',
  },
  // In minutes — actual time from called → completed
  duration:    { type: Number, required: true },
  startedAt:   { type: Date, required: true },
  completedAt: { type: Date, required: true },
}, { timestamps: true });

// Indexes for efficient rolling-average queries
ConsultationLogSchema.index({ doctorId: 1, createdAt: -1 });
ConsultationLogSchema.index({ doctorId: 1, patientType: 1, createdAt: -1 });
ConsultationLogSchema.index({ serviceId: 1, createdAt: -1 });

module.exports = mongoose.model('ConsultationLog', ConsultationLogSchema);
