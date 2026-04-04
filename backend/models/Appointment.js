const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  serviceId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date:        { type: String, required: true }, // YYYY-MM-DD
  slot:        { type: String, required: true }, // e.g. "10:00"
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'completed', 'cancelled'],
    default: 'booked',
  },
  tokenId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Token', default: null },
  notes:       { type: String, default: '' },
}, { timestamps: true });

AppointmentSchema.index({ doctorId: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
