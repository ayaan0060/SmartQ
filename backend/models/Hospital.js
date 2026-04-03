const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, lowercase: true, trim: true },
  location:        { type: String, required: true },
  address:         { type: String, required: true },
  contact:         { type: String, required: true },
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  rating:          { type: Number, default: 0, min: 0, max: 5 },
  timings:         { type: String, default: '24/7' },
  specializations: [{ type: String }],
  totalBeds:       { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'enterprise'],
    default: 'free'
  },
  adminId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  logoUrl:         { type: String, default: null },
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Hospital', HospitalSchema);
