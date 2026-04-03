const mongoose = require('mongoose');
const Service = require('./models/Service');
const Token = require('./models/Token');
const Patient = require('./models/Patient');
require('dotenv').config();

const HOSPITAL_ID = '69cec637c8d53afb77b61fab';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  // 1. Create services for Fortis Noida
  await Service.deleteMany({ hospitalId: HOSPITAL_ID });
  const services = await Service.insertMany([
    { name: 'General OPD',  avgTime: 15, prefix: 'G', hospitalId: HOSPITAL_ID },
    { name: 'Cardiology',   avgTime: 30, prefix: 'C', hospitalId: HOSPITAL_ID },
    { name: 'Orthopedics',  avgTime: 25, prefix: 'O', hospitalId: HOSPITAL_ID },
    { name: 'Pediatrics',   avgTime: 20, prefix: 'P', hospitalId: HOSPITAL_ID },
    { name: 'Dermatology',  avgTime: 20, prefix: 'D', hospitalId: HOSPITAL_ID },
  ]);
  console.log('Services created:', services.map(s => s.name).join(', '));

  // 2. Get patients
  const patients = await Patient.find({ hospitalId: HOSPITAL_ID }).limit(8).lean();
  if (!patients.length) { console.log('No patients found — run seedFull.js first'); process.exit(1); }

  // 3. Seed today's tokens
  await Token.deleteMany({ hospitalId: HOSPITAL_ID });

  const today = new Date();
  const datePrefix = `${String(today.getDate()).padStart(2,'0')}${String(today.getMonth()+1).padStart(2,'0')}`;

  const tokenData = [
    { patient: patients[0], service: services[0], status: 'in-progress', priority: 'normal' },
    { patient: patients[1], service: services[0], status: 'waiting',     priority: 'normal' },
    { patient: patients[2], service: services[1], status: 'waiting',     priority: 'high'   },
    { patient: patients[3], service: services[0], status: 'waiting',     priority: 'normal' },
    { patient: patients[4], service: services[2], status: 'waiting',     priority: 'emergency' },
    { patient: patients[5], service: services[1], status: 'completed',   priority: 'normal' },
    { patient: patients[6], service: services[3], status: 'completed',   priority: 'normal' },
    { patient: patients[7], service: services[0], status: 'waiting',     priority: 'normal' },
  ];

  for (let i = 0; i < tokenData.length; i++) {
    const { patient, service, status, priority } = tokenData[i];
    await Token.create({
      tokenNumber: `${datePrefix}-${String(i + 1).padStart(3, '0')}`,
      patientId: patient._id,
      hospitalId: HOSPITAL_ID,
      serviceId: service._id,
      status,
      priority,
      position: i + 1,
      estimatedTime: service.avgTime,
      calledAt: status === 'in-progress' ? new Date() : null,
      completedAt: status === 'completed' ? new Date() : null,
    });
  }

  console.log(`Seeded ${tokenData.length} tokens for Fortis Noida`);
  process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
