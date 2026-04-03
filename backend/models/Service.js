const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avgTime: { type: Number, required: true }, // In minutes
  prefix: { type: String, required: true }, // e.g., 'D' for Doctor
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  price: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Service', ServiceSchema);
