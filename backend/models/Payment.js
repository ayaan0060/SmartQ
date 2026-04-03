const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  orderId:    { type: String, required: true },
  amount:     { type: Number, required: true },
  currency:   { type: String, default: 'INR' },
  status:     { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  serviceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
