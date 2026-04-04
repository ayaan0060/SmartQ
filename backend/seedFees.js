const mongoose = require('mongoose');
const Doctor  = require('./models/Doctor');
const Service = require('./models/Service');
require('dotenv').config();

const HOSPITAL_ID = '69cec637c8d53afb77b61fab';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // Update service prices
  const servicePrices = {
    'General OPD':  300,
    'Cardiology':   800,
    'Orthopedics':  600,
    'Pediatrics':   500,
    'Dermatology':  400,
  };

  const services = await Service.find({ hospitalId: HOSPITAL_ID });
  for (const svc of services) {
    const price = servicePrices[svc.name] || 300;
    await Service.findByIdAndUpdate(svc._id, { price, isActive: true });
    console.log(`Service: ${svc.name} → ₹${price}`);
  }

  // Update doctor consultation fees
  const doctorFees = {
    'Dr. Arjun Mehta':  800,  // Cardiology
    'Dr. Priya Sharma': 500,  // General Medicine
    'Dr. Rahul Verma':  600,  // Orthopedics
    'Dr. Sneha Patel':  500,  // Pediatrics
    'Dr. Amit Singh':   400,  // Dermatology
  };

  const doctors = await Doctor.find({ hospitalId: HOSPITAL_ID });
  for (const doc of doctors) {
    const fee = doctorFees[doc.name] || 500;
    await Doctor.findByIdAndUpdate(doc._id, { consultationFee: fee });
    console.log(`Doctor: ${doc.name} → ₹${fee}`);
  }

  console.log('\n✅ Fees updated successfully!');
  process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
