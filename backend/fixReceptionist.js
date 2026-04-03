const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const FORTIS_ID = '69cec637c8d53afb77b61fab';
const EMAIL = 'receptionist@fortisnoida.com';
const PASSWORD = 'Admin@1234';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash(PASSWORD, 12);

  const result = await db.collection('users').updateOne(
    { email: EMAIL },
    { $set: { hospitalId: new mongoose.Types.ObjectId(FORTIS_ID), password: hash, isActive: true } }
  );

  console.log('matched:', result.matchedCount, 'modified:', result.modifiedCount);

  const u = await db.collection('users').findOne({ email: EMAIL });
  const ok = await bcrypt.compare(PASSWORD, u.password);
  console.log('email:', u.email);
  console.log('hospitalId:', u.hospitalId);
  console.log('role:', u.role);
  console.log('isActive:', u.isActive);
  console.log('passwordMatch:', ok);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
