const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Token = require('./models/Token');
require('dotenv').config();

const HOSPITAL_ID = '69cec637c8d53afb77b61fab';
const DOCTOR_ID   = '69cecbbd02dcadee8791a236'; // Dr. Arjun Mehta - Cardiology

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Create doctor user account
  await User.deleteOne({ email: 'arjun.mehta@fortisnoida.com' });
  const hash = await bcrypt.hash('Doctor@1234', 12);
  const user = await User.create({
    name: 'Dr. Arjun Mehta',
    email: 'arjun.mehta@fortisnoida.com',
    password: hash,
    role: 'doctor',
    hospitalId: HOSPITAL_ID,
    isActive: true,
  });
  console.log('Doctor user created:', user.email);

  // 2. Link user to doctor profile
  await Doctor.findByIdAndUpdate(DOCTOR_ID, { userId: user._id });
  console.log('Linked to doctor profile: Dr. Arjun Mehta');

  // 3. Assign existing waiting tokens to this doctor
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tokens = await Token.find({
    hospitalId: HOSPITAL_ID,
    status: { $in: ['waiting', 'in-progress'] },
    createdAt: { $gte: today },
  }).limit(4);

  for (const t of tokens) {
    await Token.findByIdAndUpdate(t._id, { doctorId: DOCTOR_ID });
  }
  console.log(`Assigned ${tokens.length} tokens to Dr. Arjun Mehta`);

  console.log('\n✅ Done! Login credentials:');
  console.log('Email:    arjun.mehta@fortisnoida.com');
  console.log('Password: Doctor@1234');
  console.log('Portal:   http://localhost:5173/doctor');

  process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
