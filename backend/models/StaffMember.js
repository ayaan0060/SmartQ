const mongoose = require('mongoose');

const STAFF_ROLES = [
  'nurse',
  'driver',
  'cleaner',
  'pharmacist',
  'lab_tech',
  'security',
  'reception',
];

const StaffMemberSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  role: {
    type: String,
    enum: STAFF_ROLES,
    required: true,
  },
  name:  { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },

  wardAssigned:   { type: String, trim: true, default: '' },
  ambulanceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance', default: null },
  zoneAssigned:   { type: String, trim: true, default: '' },
  pharmacyWing:   { type: String, trim: true, default: '' },
  labAssigned:    { type: String, trim: true, default: '' },
  gateOrFloor:    { type: String, trim: true, default: '' },
  frontDesk:      { type: String, trim: true, default: '' },

  shift: {
    start: { type: String, default: '' },
    end:   { type: String, default: '' },
    days:  [{ type: String, trim: true }],
  },

  isActive: { type: Boolean, default: true },
  notes:    { type: String, trim: true, default: '' },
}, { timestamps: true });

StaffMemberSchema.index({ hospitalId: 1, role: 1 });
StaffMemberSchema.index({ hospitalId: 1, isActive: 1 });

module.exports = mongoose.model('StaffMember', StaffMemberSchema);
module.exports.STAFF_ROLES = STAFF_ROLES;
