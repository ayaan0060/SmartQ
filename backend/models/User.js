const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone:      { type: String, sparse: true, trim: true },
  password:   { type: String, required: true },
  role: {
    type: String,
    enum: ['super-admin', 'hospital-admin', 'receptionist', 'staff', 'patient'],
    default: 'patient'
  },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
  avatar:     { type: String, default: null },
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date, default: null },
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
