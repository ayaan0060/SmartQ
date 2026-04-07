const mongoose = require('mongoose');
const User = require('./models/User');
const Hospital = require('./models/Hospital');
const Task = require('./models/Task');
const StaffSchedule = require('./models/StaffSchedule');
const Announcement = require('./models/Announcement');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartq';

async function seedStaffPortal() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Update existing staff user to 'staff' role
    const staffUser = await User.findOne({ email: 'staff@cityhospital.com' });
    if (!staffUser) {
      console.error('❌ Staff user not found. Please run seedTestData.js first.');
      process.exit(1);
    }

    staffUser.role = 'staff';
    await staffUser.save();
    console.log('✅ Updated Rahul Verma to "staff" role');

    const hospital = await Hospital.findById(staffUser.hospitalId);
    if (!hospital) {
      console.error('❌ Hospital not found for staff user.');
      process.exit(1);
    }

    // 2. Clear existing portal data to prevent duplicates
    await Task.deleteMany({ assignedTo: staffUser._id });
    await StaffSchedule.deleteMany({ staff: staffUser._id });
    await Announcement.deleteMany({ hospital: hospital._id });

    // 3. Create Tasks
    const today = new Date();
    const tasks = [
      {
        title: 'Morning Inventory Check',
        description: 'Check bandage and syringe stock in Ward A.',
        assignedTo: staffUser._id,
        hospital: hospital._id,
        priority: 'high',
        status: 'pending',
        date: today,
        dueTime: new Date(today.setHours(9, 0, 0, 0)),
      },
      {
        title: 'Sanitization Round',
        description: 'Ensure all bed railings are wiped down with disinfectant.',
        assignedTo: staffUser._id,
        hospital: hospital._id,
        priority: 'normal',
        status: 'in_progress',
        date: today,
        dueTime: new Date(new Date().setHours(11, 30, 0, 0)),
      },
      {
        title: 'Emergency Cart Restock',
        description: 'Verify oxygen cylinders and emergency meds are full.',
        assignedTo: staffUser._id,
        hospital: hospital._id,
        priority: 'urgent',
        status: 'pending',
        date: today,
      },
      {
        title: 'Patient Meal Coordination',
        description: 'Distribute lunch trays to rooms 201-215.',
        assignedTo: staffUser._id,
        hospital: hospital._id,
        priority: 'normal',
        status: 'completed',
        date: today,
      }
    ];
    await Task.insertMany(tasks);
    console.log('✅ Created 4 tasks for staff user');

    // 4. Create Schedule
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7)); // Get Monday
    weekStart.setHours(0, 0, 0, 0);

    const shifts = [];
    const types = ['morning', 'morning', 'evening', 'evening', 'night', 'off', 'off'];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      shifts.push({
        date,
        type: types[i],
        ward: 'General Ward - A',
        startTime: types[i] === 'morning' ? '06:00' : types[i] === 'evening' ? '14:00' : types[i] === 'night' ? '22:00' : '',
        endTime: types[i] === 'morning' ? '14:00' : types[i] === 'evening' ? '22:00' : types[i] === 'night' ? '06:00' : '',
      });
    }

    await StaffSchedule.create({
      staff: staffUser._id,
      hospital: hospital._id,
      shifts
    });
    console.log('✅ Created weekly schedule for staff user');

    // 5. Create Announcements
    const announcements = [
      {
        title: 'New Mask Mandate',
        message: 'All staff must wear N95 masks when entering the ICU area effective immediately.',
        hospital: hospital._id,
        priority: 'important',
        targetRoles: ['all'],
      },
      {
        title: 'Elevator Maintenance',
        message: 'Service Elevator B will be down for maintenance between 2 PM and 4 PM today.',
        hospital: hospital._id,
        priority: 'normal',
        targetRoles: ['staff', 'nurse'],
      },
      {
        title: 'Staff Meeting Reminder',
        message: 'Monthly staff meeting in the cafeteria at 5:00 PM on Friday.',
        hospital: hospital._id,
        priority: 'normal',
        targetRoles: ['all'],
      }
    ];
    await Announcement.insertMany(announcements);
    console.log('✅ Created 3 announcements for the hospital');

    console.log('\n🚀 Staff Portal Seed Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedStaffPortal();
