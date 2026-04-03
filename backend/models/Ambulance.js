const mongoose = require('mongoose');

const AmbulanceSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  driverName:    { type: String, trim: true, default: '' },
  driverPhone:   { type: String, trim: true, default: '' },
  hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  status: {
    type: String,
    enum: ['available', 'dispatched', 'returning', 'offline'],
    default: 'available',
  },
  currentLocation: {
    lat:       { type: Number, default: null },
    lng:       { type: Number, default: null },
    updatedAt: { type: Date,   default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
