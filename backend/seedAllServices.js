const mongoose = require('mongoose');
const Service = require('./models/Service');
require('dotenv').config();

const HOSPITALS = {
  '69c4d7843a9d7e8d8a974cc0': { // AIIMS Bhubaneswar
    services: [
      { name: 'General OPD',      avgTime: 15, prefix: 'G', price: 100 },
      { name: 'Cardiology',       avgTime: 30, prefix: 'C', price: 500 },
      { name: 'Neurology',        avgTime: 30, prefix: 'N', price: 600 },
      { name: 'Oncology',         avgTime: 45, prefix: 'O', price: 800 },
      { name: 'Emergency',        avgTime: 10, prefix: 'E', price: 200 },
      { name: 'Radiology / X-Ray',avgTime: 20, prefix: 'R', price: 300 },
    ]
  },
  '69c4d7843a9d7e8d8a974cc1': { // SCB Medical College
    services: [
      { name: 'General Medicine', avgTime: 15, prefix: 'G', price: 100 },
      { name: 'Orthopedics',      avgTime: 25, prefix: 'O', price: 400 },
      { name: 'Pediatrics',       avgTime: 20, prefix: 'P', price: 300 },
      { name: 'Gynecology',       avgTime: 25, prefix: 'Y', price: 400 },
      { name: 'ENT',              avgTime: 20, prefix: 'T', price: 300 },
      { name: 'Ophthalmology',    avgTime: 20, prefix: 'H', price: 350 },
    ]
  },
  '69c4d7843a9d7e8d8a974cc2': { // Apollo Hospitals Bhubaneswar
    services: [
      { name: 'Cardiac Surgery',  avgTime: 45, prefix: 'C', price: 1200 },
      { name: 'Gastroenterology', avgTime: 30, prefix: 'G', price: 700 },
      { name: 'Nephrology',       avgTime: 30, prefix: 'N', price: 700 },
      { name: 'Dermatology',      avgTime: 20, prefix: 'D', price: 500 },
      { name: 'Pulmonology',      avgTime: 25, prefix: 'L', price: 600 },
      { name: 'Endocrinology',    avgTime: 25, prefix: 'E', price: 600 },
    ]
  },
  '69c4d7843a9d7e8d8a974cc3': { // Hi-Tech Medical College
    services: [
      { name: 'General Surgery',  avgTime: 30, prefix: 'S', price: 400 },
      { name: 'Urology',          avgTime: 25, prefix: 'U', price: 500 },
      { name: 'Psychiatry',       avgTime: 40, prefix: 'P', price: 600 },
      { name: 'Dental',           avgTime: 30, prefix: 'D', price: 400 },
      { name: 'Physiotherapy',    avgTime: 45, prefix: 'F', price: 300 },
    ]
  },
  '69c4d7843a9d7e8d8a974cc4': { // SUM Hospital
    services: [
      { name: 'Neurosurgery',     avgTime: 45, prefix: 'N', price: 1000 },
      { name: 'Spine Surgery',    avgTime: 45, prefix: 'S', price: 1000 },
      { name: 'Vascular Surgery', avgTime: 40, prefix: 'V', price: 900 },
      { name: 'Rheumatology',     avgTime: 30, prefix: 'R', price: 600 },
      { name: 'Sports Medicine',  avgTime: 25, prefix: 'M', price: 500 },
    ]
  },
  '69c4d7843a9d7e8d8a974cc5': { // Capital Hospital
    services: [
      { name: 'General OPD',      avgTime: 15, prefix: 'G', price: 50  },
      { name: 'Pediatrics',       avgTime: 20, prefix: 'P', price: 100 },
      { name: 'Gynecology',       avgTime: 25, prefix: 'Y', price: 150 },
      { name: 'Vaccination',      avgTime: 10, prefix: 'V', price: 50  },
    ]
  },
  '69c4d7843a9d7e8d8a974cc6': { // Sparsh Hospital
    services: [
      { name: 'Orthopedics',      avgTime: 25, prefix: 'O', price: 600 },
      { name: 'Joint Replacement',avgTime: 45, prefix: 'J', price: 1000},
      { name: 'Sports Injury',    avgTime: 30, prefix: 'S', price: 500 },
      { name: 'Physiotherapy',    avgTime: 45, prefix: 'F', price: 300 },
    ]
  },
  '69ceb5c035dc6afe21a5cb78': { // Apollo hospital (new)
    services: [
      { name: 'General OPD',      avgTime: 15, prefix: 'G', price: 300 },
      { name: 'Cardiology',       avgTime: 30, prefix: 'C', price: 800 },
      { name: 'Orthopedics',      avgTime: 25, prefix: 'O', price: 600 },
      { name: 'Neurology',        avgTime: 30, prefix: 'N', price: 700 },
      { name: 'Pediatrics',       avgTime: 20, prefix: 'P', price: 500 },
      { name: 'Dermatology',      avgTime: 20, prefix: 'D', price: 400 },
      { name: 'Gynecology',       avgTime: 25, prefix: 'Y', price: 500 },
      { name: 'Emergency',        avgTime: 10, prefix: 'E', price: 200 },
    ]
  },
  '69cec637c8d53afb77b61fab': { // Fortis Hospital Noida
    services: [
      { name: 'General OPD',      avgTime: 15, prefix: 'G', price: 300 },
      { name: 'Cardiology',       avgTime: 30, prefix: 'C', price: 800 },
      { name: 'Orthopedics',      avgTime: 25, prefix: 'O', price: 600 },
      { name: 'Pediatrics',       avgTime: 20, prefix: 'P', price: 500 },
      { name: 'Dermatology',      avgTime: 20, prefix: 'D', price: 400 },
    ]
  },
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  for (const [hospitalId, { services }] of Object.entries(HOSPITALS)) {
    // Remove existing services for this hospital
    await Service.deleteMany({ hospitalId });

    // Insert new services with prices
    const created = await Service.insertMany(
      services.map(s => ({ ...s, hospitalId, isActive: true }))
    );
    console.log(`✅ ${hospitalId} — ${created.length} services added`);
  }

  console.log('\nAll services seeded with fees!');
  process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
