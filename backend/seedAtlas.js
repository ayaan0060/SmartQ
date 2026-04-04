const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Hospital = require('./models/Hospital');
const Service = require('./models/Service');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing collections...');
    await Hospital.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});
    await Doctor.deleteMany({});
    console.log('✅ Collections cleared\n');
    
    // ── 1. Super Admin ──────────────────────────────────────────────
    console.log('👤 Creating Super Admin...');
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@smartq.com',
      phone: '+919999900000',
      password: 'Admin@1234',      // User model pre-save hook hashes this
      role: 'super-admin',          // ← hyphen, not underscore
      hospitalId: null,
    });
    console.log('✅ Super Admin created: superadmin@smartq.com / Admin@1234\n');
    
    // ── 2. Hospitals ────────────────────────────────────────────────
    console.log('🏥 Creating hospitals...');
    const hospitals = await Hospital.insertMany([
      {
        name: 'Fortis Memorial Research Institute',
        location: 'Gurugram, Haryana',
        address: 'Sector 44, Gurugram, Haryana 122002',
        rating: 4.8,
        timings: '24/7',
        contact: '+911244962200',
        code: 'FORTIS',
        email: 'info@fortis.com',
        status: 'active',
      },
      {
        name: 'AIIMS Delhi',
        location: 'New Delhi',
        address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029',
        rating: 4.9,
        timings: '24/7',
        contact: '+911126588500',
        code: 'AIIMS',
        email: 'info@aiims.edu',
        status: 'active',
      },
      {
        name: 'Apollo Hospital',
        location: 'Chennai, Tamil Nadu',
        address: '21 Greams Lane, Off Greams Road, Chennai 600006',
        rating: 4.7,
        timings: '24/7',
        contact: '+914428290200',
        code: 'APOLLO',
        email: 'info@apollohospitals.com',
        status: 'active',
      },
      {
        name: 'Max Super Speciality Hospital',
        location: 'Saket, New Delhi',
        address: '1, 2, Press Enclave Road, Saket, New Delhi 110017',
        rating: 4.6,
        timings: '24/7',
        contact: '+911126515050',
        code: 'MAX',
        email: 'info@maxhealthcare.com',
        status: 'active',
      },
      {
        name: 'Medanta - The Medicity',
        location: 'Gurugram, Haryana',
        address: 'CH Baktawar Singh Road, Sector 38, Gurugram 122001',
        rating: 4.7,
        timings: '24/7',
        contact: '+911244141414',
        code: 'MEDANTA',
        email: 'info@medanta.org',
        status: 'active',
      },
    ]);
    console.log(`✅ Created ${hospitals.length} hospitals\n`);

    // ── 3. Hospital Admins ──────────────────────────────────────────
    console.log('👤 Creating hospital admin accounts...');
    for (const hospital of hospitals) {
      const adminEmail = `admin@${hospital.code.toLowerCase()}.com`;
      const admin = await User.create({
        name: `${hospital.name} Admin`,
        email: adminEmail,
        password: 'Admin@1234',
        role: 'hospital-admin',
        hospitalId: hospital._id,
      });
      hospital.adminId = admin._id;
      await hospital.save();
      console.log(`  ✓ ${adminEmail}`);
    }
    console.log('');

    // ── 4. Doctors ──────────────────────────────────────────────────
    console.log('🩺 Creating doctors...');
    const specializations = ['Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Medicine', 'Dermatology'];
    for (const hospital of hospitals) {
      for (let i = 0; i < 3; i++) {
        await Doctor.create({
          name: `Dr. ${['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar'][Math.floor(Math.random() * 5)]} ${String.fromCharCode(65 + i)}`,
          specialization: specializations[Math.floor(Math.random() * specializations.length)],
          hospitalId: hospital._id,
          isAvailable: true,
          consultationFee: Math.floor(Math.random() * 500) + 300,
        });
      }
    }
    console.log(`✅ Created ${hospitals.length * 3} doctors\n`);

    // ── 5. Services ─────────────────────────────────────────────────
    console.log('🔧 Creating services...');
    let serviceCount = 0;
    const serviceTemplates = [
      { name: 'Emergency Care', prefix: 'ER', avgTime: 15, price: 500, description: 'Urgent Medical Care' },
      { name: 'Cardiology', prefix: 'CD', avgTime: 30, price: 800, description: 'Heart & Cardiovascular Services' },
      { name: 'Pediatrics', prefix: 'PD', avgTime: 20, price: 400, description: 'Child Health Services' },
      { name: 'General Checkup', prefix: 'GC', avgTime: 15, price: 300, description: 'Routine Health Checkup' },
      { name: 'Orthopedics', prefix: 'OR', avgTime: 25, price: 600, description: 'Bone & Joint Services' },
      { name: 'Neurology', prefix: 'NR', avgTime: 30, price: 900, description: 'Brain & Nerve Services' },
    ];
    for (const hospital of hospitals) {
      for (const tmpl of serviceTemplates) {
        await Service.create({ ...tmpl, hospitalId: hospital._id });
        serviceCount++;
      }
    }
    console.log(`✅ Created ${serviceCount} services\n`);

    // ── 6. Sample Patient ───────────────────────────────────────────
    console.log('👤 Creating sample patient...');
    await User.create({
      name: 'Test Patient',
      email: 'patient@smartq.com',
      phone: '+919999911111',
      password: 'Patient@1234',
      role: 'patient',
      hospitalId: null,
    });
    console.log('✅ Sample patient: patient@smartq.com / Patient@1234\n');

    // ── Summary ─────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log('🎉 Database seeded successfully!');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('  Super Admin:  superadmin@smartq.com / Admin@1234');
    console.log('  Patient:      patient@smartq.com / Patient@1234');
    console.log('  Hospital Admin: admin@fortis.com / Admin@1234');
    console.log('');
    console.log(`🏥 Hospitals: ${hospitals.length}`);
    console.log(`🩺 Doctors:   ${hospitals.length * 3}`);
    console.log(`🔧 Services:  ${serviceCount}`);
    console.log(`👤 Users:     ${hospitals.length + 2}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key:', JSON.stringify(error.keyValue));
    }
    process.exit(1);
  }
};

seedDatabase();
