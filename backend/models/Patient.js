const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, lowercase: true, trim: true },
  phone:          { type: String, trim: true },
  dateOfBirth:    { type: Date },
  gender:         { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup:     { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'], default: 'Unknown' },
  hospitalId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  address:        { type: String },
  medicalHistory: [{ condition: String, diagnosedAt: Date, notes: String }],
  allergies:      [{ type: String }],
  emergencyContact: {
    name:  { type: String },
    phone: { type: String },
    relation: { type: String }
  },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
