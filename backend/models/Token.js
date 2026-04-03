const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  tokenNumber:    { type: String, required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  patientId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  doctorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  hospitalId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  serviceId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  priority: {
    type: String,
    enum: ['normal', 'high', 'emergency'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'skipped', 'cancelled'],
    default: 'waiting'
  },
  position:        { type: Number },
  estimatedTime:   { type: Number, default: 15 }, // minutes
  isCheckedIn:     { type: Boolean, default: false },
  notes:           { type: String, default: '' },
  calledAt:        { type: Date, default: null },
  servedAt:        { type: Date, default: null },
  completedAt:     { type: Date, default: null },
  waitTime:        { type: Number, default: null }, // actual wait in minutes
  paymentId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null }
}, { timestamps: true });

// Index for fast hospital+status queries
TokenSchema.index({ hospitalId: 1, status: 1 });
TokenSchema.index({ hospitalId: 1, serviceId: 1, status: 1 });

module.exports = mongoose.model('Token', TokenSchema);
