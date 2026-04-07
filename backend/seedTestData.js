/**
 * SmartQ — Seed Test Data
 * Creates: 1 Super Admin, 1 Hospital, 1 Hospital Admin, 1 Patient, 1 Staff,
 *          1 Doctor, 2 Services, 1 Ambulance
 *
 * Credentials:
 *   Super Admin   → superadmin@smartq.com  / Admin@123
 *   Hospital Admin → admin@cityhospital.com / Admin@123
 *   Patient        → patient@test.com       / Patient@123
 *   Staff (user)   → staff@cityhospital.com / Staff@123
 *   Doctor (user)  → doctor@cityhospital.com / Doctor@123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Patient = require('./models/Patient');
const StaffMember = require('./models/StaffMember');
const Doctor = require('./models/Doctor');
const Service = require('./models/Service');
const Ambulance = require('./models/Ambulance');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartq';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ── 1. Super Admin ──────────────────────────────────
    let superAdmin = await User.findOne({ email: 'superadmin@smartq.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@smartq.com',
        phone: '+919999999999',
        password: 'Admin@123',
        role: 'super-admin',
        isActive: true,
      });
      console.log('✅ Super Admin created');
    } else {
      console.log('⏩ Super Admin already exists');
    }

    // ── 2. Hospital ─────────────────────────────────────
    let hospital = await Hospital.findOne({ code: 'CITYHOSP' });
    if (!hospital) {
      hospital = await Hospital.create({
        name: 'City General Hospital',
        email: 'info@cityhospital.com',
        location: 'Mumbai, Maharashtra',
        address: '123 Health Road, Andheri West, Mumbai 400058',
        contact: '+912212345678',
        code: 'CITYHOSP',
        rating: 4.5,
        timings: '24/7',
        specializations: ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics'],
        totalBeds: 200,
        status: 'active',
        plan: 'enterprise',
        latitude: 19.1364,
        longitude: 72.8296,
        coordinates: { lat: 19.1364, lng: 72.8296 },
        settings: { doctorInactivityMinutes: 30 },
      });
      console.log('✅ Hospital created');
    } else {
      console.log('⏩ Hospital already exists');
    }

    // ── 3. Hospital Admin ───────────────────────────────
    let hospitalAdmin = await User.findOne({ email: 'admin@cityhospital.com' });
    if (!hospitalAdmin) {
      hospitalAdmin = await User.create({
        name: 'Dr. Rajesh Kumar',
        email: 'admin@cityhospital.com',
        phone: '+919876543210',
        password: 'Admin@123',
        role: 'hospital-admin',
        hospitalId: hospital._id,
        isActive: true,
      });
      // Link admin to hospital
      await Hospital.findByIdAndUpdate(hospital._id, { adminId: hospitalAdmin._id });
      console.log('✅ Hospital Admin created & linked');
    } else {
      console.log('⏩ Hospital Admin already exists');
      await Hospital.findByIdAndUpdate(hospital._id, { adminId: hospitalAdmin._id });
    }

    // ── 4. Doctor (User + Doctor record) ────────────────
    let doctorUser = await User.findOne({ email: 'doctor@cityhospital.com' });
    if (!doctorUser) {
      doctorUser = await User.create({
        name: 'Dr. Priya Sharma',
        email: 'doctor@cityhospital.com',
        phone: '+919876543211',
        password: 'Doctor@123',
        role: 'doctor',
        hospitalId: hospital._id,
        isActive: true,
      });
      console.log('✅ Doctor User created');
    } else {
      console.log('⏩ Doctor User already exists');
    }

    let doctor = await Doctor.findOne({ email: 'doctor@cityhospital.com' });
    if (!doctor) {
      doctor = await Doctor.create({
        name: 'Dr. Priya Sharma',
        email: 'doctor@cityhospital.com',
        phone: '+919876543211',
        specialization: 'General Medicine',
        hospitalId: hospital._id,
        userId: doctorUser._id,
        isAvailable: true,
        consultationFee: 500,
        schedule: {
          monday:    { start: '09:00', end: '17:00', available: true },
          tuesday:   { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday:  { start: '09:00', end: '17:00', available: true },
          friday:    { start: '09:00', end: '17:00', available: true },
          saturday:  { start: '10:00', end: '14:00', available: true },
          sunday:    { start: '', end: '', available: false },
        },
      });
      console.log('✅ Doctor record created');
    } else {
      console.log('⏩ Doctor record already exists');
    }

    // ── 5. Services ─────────────────────────────────────
    let svcGeneral = await Service.findOne({ prefix: 'GM', hospitalId: hospital._id });
    if (!svcGeneral) {
      svcGeneral = await Service.create({
        name: 'General Medicine',
        avgTime: 15,
        prefix: 'GM',
        hospitalId: hospital._id,
        price: 500,
        isActive: true,
      });
      console.log('✅ Service (General Medicine) created');
    } else {
      console.log('⏩ Service (General Medicine) already exists');
    }

    let svcCardio = await Service.findOne({ prefix: 'CD', hospitalId: hospital._id });
    if (!svcCardio) {
      svcCardio = await Service.create({
        name: 'Cardiology',
        avgTime: 20,
        prefix: 'CD',
        hospitalId: hospital._id,
        price: 800,
        isActive: true,
      });
      console.log('✅ Service (Cardiology) created');
    } else {
      console.log('⏩ Service (Cardiology) already exists');
    }

    // ── 6. Patient (User + Patient record) ──────────────
    let patientUser = await User.findOne({ email: 'patient@test.com' });
    if (!patientUser) {
      patientUser = await User.create({
        name: 'Amit Patel',
        email: 'patient@test.com',
        phone: '+919123456789',
        password: 'Patient@123',
        role: 'patient',
        isActive: true,
      });
      console.log('✅ Patient User created');
    } else {
      console.log('⏩ Patient User already exists');
    }

    let patient = await Patient.findOne({ email: 'patient@test.com', hospitalId: hospital._id });
    if (!patient) {
      patient = await Patient.create({
        name: 'Amit Patel',
        email: 'patient@test.com',
        phone: '+919123456789',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'male',
        bloodGroup: 'B+',
        hospitalId: hospital._id,
        userId: patientUser._id,
        address: '456 Patient Lane, Bandra, Mumbai',
        isActive: true,
      });
      console.log('✅ Patient record created');
    } else {
      console.log('⏩ Patient record already exists');
    }

    // ── 7. Staff (User + StaffMember record) ────────────
    let staffUser = await User.findOne({ email: 'staff@cityhospital.com' });
    if (!staffUser) {
      staffUser = await User.create({
        name: 'Rahul Verma',
        email: 'staff@cityhospital.com',
        phone: '+919876543212',
        password: 'Staff@123',
        role: 'receptionist',
        hospitalId: hospital._id,
        isActive: true,
      });
      console.log('✅ Staff User created');
    } else {
      console.log('⏩ Staff User already exists');
    }

    let staffMember = await StaffMember.findOne({ email: 'staff@cityhospital.com', hospitalId: hospital._id });
    if (!staffMember) {
      staffMember = await StaffMember.create({
        hospitalId: hospital._id,
        role: 'nurse',
        name: 'Rahul Verma',
        email: 'staff@cityhospital.com',
        phone: '+919876543212',
        wardAssigned: 'Ward A - General',
        shift: { start: '08:00', end: '20:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
        isActive: true,
        notes: 'Senior nurse, Ward A',
      });
      console.log('✅ StaffMember record created');
    } else {
      console.log('⏩ StaffMember record already exists');
    }

    // ── 8. Ambulance ────────────────────────────────────
    let ambulance = await Ambulance.findOne({ vehicleNumber: 'MH01AB1234' });
    if (!ambulance) {
      ambulance = await Ambulance.create({
        vehicleNumber: 'MH01AB1234',
        driverName: 'Suresh Yadav',
        driverPhone: '+919812345678',
        hospitalId: hospital._id,
        status: 'available',
      });
      console.log('✅ Ambulance created');
    } else {
      console.log('⏩ Ambulance already exists');
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅ SEED COMPLETE — Test Credentials:');
    console.log('═══════════════════════════════════════════════');
    console.log('  Super Admin    → superadmin@smartq.com    / Admin@123');
    console.log('  Hospital Admin → admin@cityhospital.com   / Admin@123');
    console.log('  Doctor         → doctor@cityhospital.com  / Doctor@123');
    console.log('  Patient        → patient@test.com         / Patient@123');
    console.log('  Staff          → staff@cityhospital.com   / Staff@123');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Hospital: ${hospital.name} (${hospital.code})`);
    console.log(`  Hospital ID: ${hospital._id}`);
    console.log('═══════════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
