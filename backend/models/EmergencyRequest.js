const mongoose = require('mongoose');

const EmergencyRequestSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',      required: true },
  hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital',  required: true },
  ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance', default: null },
  patientLocation: {
    lat:     { type: Number },
    lng:     { type: Number },
    address: { type: String, default: '' },
  },
  emergencyType: {
    type:    String,
    enum:    ['medical', 'accident', 'transfer', 'other'],
    default: 'medical',
  },
  status: {
    type: String,
    // en_route + arriving are new — existing values kept intact
    enum: ['requested', 'acknowledged', 'dispatched', 'en_route', 'arriving', 'arrived', 'completed', 'cancelled'],
    default: 'requested',
  },
  requestedAt:  { type: Date, default: Date.now },
  dispatchedAt: { type: Date },
  enRouteAt:    { type: Date },   // new
  arrivedAt:    { type: Date },
  completedAt:  { type: Date },
  notes:        { type: String, default: '' },
  rating:       { type: Number, min: 1, max: 5, default: null },
  source:       { type: String, default: 'standard' }, // 'standard' | 'quick_access_sos'
}, { timestamps: true });

module.exports = mongoose.model('EmergencyRequest', EmergencyRequestSchema);
