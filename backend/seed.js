const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Service = require('./models/Service');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartqueue');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Hospital.deleteMany({});
    await Service.deleteMany({});

    const hospitals = [
      {
        name: 'City General Hospital',
        location: 'Downtown, Metropolis',
        address: '123 Healthcare Ave, Metropolis',
        rating: 4.8,
        timings: '24/7',
        contact: '+1 555-0101',
        code: 'CITY'
      },
      {
        name: 'St. Mary\'s Specialized Clinic',
        location: 'West End, Metropolis',
        address: '456 Wellness Blvd, Metropolis',
        rating: 4.5,
        timings: '08:00 AM - 10:00 PM',
        contact: '+1 555-0202',
        code: 'MARY'
      },
      {
        name: 'Apex Children\'s Hospital',
        location: 'North Side, Metropolis',
        address: '789 Care Lane, Metropolis',
        rating: 4.9,
        timings: '24/7',
        contact: '+1 555-0303',
        code: 'APEX'
      }
    ];

    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log('Hospitals seeded!');

    const services = [
      { name: 'General OPD', avgTime: 15, prefix: 'G', hospitalId: createdHospitals[0]._id },
      { name: 'Cardiology', avgTime: 30, prefix: 'C', hospitalId: createdHospitals[0]._id },
      { name: 'Pediatrics', avgTime: 20, prefix: 'P', hospitalId: createdHospitals[1]._id },
      { name: 'Dermatology', avgTime: 25, prefix: 'D', hospitalId: createdHospitals[1]._id },
      { name: 'Emergency', avgTime: 10, prefix: 'E', hospitalId: createdHospitals[2]._id },
    ];

    await Service.insertMany(services);
    console.log('Services seeded!');

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
