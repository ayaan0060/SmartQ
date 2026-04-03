const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const StaffMember = require('./models/StaffMember');
require('dotenv').config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/queue_system');
  console.log('Connected');

  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await StaffMember.deleteMany({});

  const hospitals = await Hospital.find({}).lean();
  console.log('Hospitals:', hospitals.length);

  const specs = ['Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Neurology', 'Gynecology', 'ENT'];
  const doctorNames = ['Dr. Arjun Mehta', 'Dr. Priya Sharma', 'Dr. Rahul Verma', 'Dr. Sneha Patel', 'Dr. Amit Singh'];
  const patientNames = ['Ravi Kumar', 'Sunita Devi', 'Mohan Lal', 'Geeta Singh', 'Arun Sharma', 'Pooja Yadav', 'Vikram Bose', 'Meena Joshi', 'Suresh Nair', 'Deepa Pillai'];
  const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'];
  const staffRoles = ['nurse', 'pharmacist', 'lab_tech', 'reception', 'security', 'cleaner'];
  const staffNames = ['Ramesh Kumar', 'Sita Devi', 'Ajay Gupta', 'Nisha Rao', 'Manoj Tiwari', 'Lata Mishra'];

  for (const h of hospitals) {
    const code = h.code.toLowerCase();

    // 5 Doctors
    for (let i = 0; i < 5; i++) {
      await Doctor.create({
        name: doctorNames[i],
        email: `dr${i}.${code}@hospital.com`,
        phone: `+91 98${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        specialization: specs[i % specs.length],
        hospitalId: h._id,
        isAvailable: true,
        consultationFee: [300, 500, 400, 600, 350][i],
        schedule: {
          monday:    { start: '09:00', end: '17:00', available: true },
          tuesday:   { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday:  { start: '09:00', end: '17:00', available: true },
          friday:    { start: '09:00', end: '17:00', available: true },
          saturday:  { start: '09:00', end: '13:00', available: true },
          sunday:    { start: '', end: '', available: false },
        },
      });
    }

    // 10 Patients
    for (let i = 0; i < 10; i++) {
      await Patient.create({
        name: patientNames[i],
        email: `${patientNames[i].replace(' ', '').toLowerCase()}${i}.${code}@gmail.com`,
        phone: `+91 70${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        bloodGroup: bloodGroups[i % bloodGroups.length],
        hospitalId: h._id,
        dateOfBirth: new Date(1970 + i * 3, i % 12, (i % 28) + 1),
        address: `${i + 1} Main Street, ${h.location}`,
        isActive: true,
      });
    }

    // 6 Staff
    for (let i = 0; i < 6; i++) {
      await StaffMember.create({
        name: staffNames[i],
        email: `staff${i}.${code}@hospital.com`,
        phone: `+91 80${String(Math.floor(10000000 + Math.random() * 89999999))}`,
        role: staffRoles[i],
        hospitalId: h._id,
        shift: { start: '08:00', end: '16:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        isActive: true,
      });
    }

    console.log(`✅ ${h.name} — 5 doctors, 10 patients, 6 staff`);
  }

  console.log('Seeding complete!');
  process.exit();
};

run().catch(err => { console.error(err); process.exit(1); });
