const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Import all models
const Hospital = require('./models/Hospital');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Service = require('./models/Service');
const Token = require('./models/Token');
const EmergencyRequest = require('./models/EmergencyRequest');
const Payment = require('./models/Payment');
const Ambulance = require('./models/Ambulance');
const StaffMember = require('./models/StaffMember');
const Branch = require('./models/Branch');

dotenv.config();

const LOCAL_DB = 'mongodb://localhost:27017/queue_system';
const ATLAS_DB = process.env.MONGODB_URI;
const CONNECTION_TIMEOUT = 10000; // 10 second timeout

const migrateData = async () => {
  let sourceConnection = null;
  let atlasConnection = null;

  try {
    console.log('🔄 Starting data migration...\n');

    // Connect to local MongoDB
    console.log('📡 Connecting to local MongoDB...');
    try {
      sourceConnection = await Promise.race([
        mongoose.createConnection(LOCAL_DB, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Local MongoDB connection timeout')), CONNECTION_TIMEOUT)
        )
      ]);
      console.log('✅ Connected to local MongoDB\n');
    } catch (err) {
      console.error('❌ Failed to connect to local MongoDB:', err.message);
      console.log('⚠️  Make sure MongoDB is running on localhost:27017');
      process.exit(1);
    }

    // Connect to Atlas
    console.log('📡 Connecting to MongoDB Atlas...');
    try {
      atlasConnection = await Promise.race([
        mongoose.createConnection(ATLAS_DB, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Atlas connection timeout')), CONNECTION_TIMEOUT)
        )
      ]);
      console.log('✅ Connected to MongoDB Atlas\n');
    } catch (err) {
      console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
      console.log('⚠️  Check your MONGODB_URI in .env file');
      process.exit(1);
    }

    // Define collections to migrate
    const collections = [
      { name: 'Hospital', model: Hospital },
      { name: 'User', model: User },
      { name: 'Patient', model: Patient },
      { name: 'Doctor', model: Doctor },
      { name: 'Service', model: Service },
      { name: 'Token', model: Token },
      { name: 'EmergencyRequest', model: EmergencyRequest },
      { name: 'Payment', model: Payment },
      { name: 'Ambulance', model: Ambulance },
      { name: 'StaffMember', model: StaffMember },
      { name: 'Branch', model: Branch }
    ];

    // Migrate each collection
    for (const collection of collections) {
      try {
        // Get data from local DB
        const db = sourceConnection.db;
        const data = await db.collection(collection.name.toLowerCase()).find({}).toArray();

        if (data.length === 0) {
          console.log(`⏭️  ${collection.name}: No data to migrate`);
          continue;
        }

        // Insert into Atlas
        const atlasDb = atlasConnection.db;
        const result = await atlasDb.collection(collection.name.toLowerCase()).insertMany(data);
        
        console.log(`✅ ${collection.name}: Migrated ${result.insertedIds.length} documents`);
      } catch (err) {
        console.error(`❌ Error migrating ${collection.name}:`, err.message);
      }
    }

    console.log('\n🎉 Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceConnection) await sourceConnection.close();
    if (atlasConnection) await atlasConnection.close();
    console.log('\n🔌 Database connections closed');
  }
};

migrateData();
