const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Token = require('../models/Token');
const User = require('../models/User');
const mongoose = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

// GET /api/stats — super-admin: global; hospital-admin: their hospital
const getStats = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user.role === 'super-admin';
  const hospitalId = req.user.hospitalId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isSuperAdmin) {
    const [hospitals, doctors, patients, users, todayTokens, totalTokens] = await Promise.all([
      Hospital.countDocuments(),
      Doctor.countDocuments(),
      Patient.countDocuments(),
      User.countDocuments(),
      Token.countDocuments({ createdAt: { $gte: today } }),
      Token.countDocuments(),
    ]);

    // Last 7 days token activity
    const last7Days = await Token.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Hospitals with most activity
    const topHospitals = await Token.aggregate([
      { $group: { _id: '$hospitalId', tokens: { $sum: 1 } } },
      { $sort: { tokens: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'hospitals', localField: '_id', foreignField: '_id', as: 'hospital' } },
      { $unwind: '$hospital' },
      { $project: { name: '$hospital.name', tokens: 1 } }
    ]);

    return success(res, { hospitals, doctors, patients, users, todayTokens, totalTokens, last7Days, topHospitals });
  }

  // Hospital admin stats
  if (!hospitalId) {
    return success(res, {
      totalDoctors: 0, totalPatients: 0, todayTokens: 0, waitingTokens: 0, completedToday: 0,
      avgWaitTime: 0, last7Days: []
    });
  }
  
  const hospitalObjId = new mongoose.Types.ObjectId(hospitalId);
  const [totalDoctors, totalPatients, todayTokens, waitingTokens, inProgressTokens, completedToday, avgWait] = await Promise.all([
    Doctor.countDocuments({ hospitalId }),
    Patient.countDocuments({ hospitalId }),
    Token.countDocuments({ hospitalId, createdAt: { $gte: today } }),
    Token.countDocuments({ hospitalId, status: 'waiting',     createdAt: { $gte: today } }),
    Token.countDocuments({ hospitalId, status: 'in-progress', createdAt: { $gte: today } }),
    Token.countDocuments({ hospitalId, status: 'completed',   createdAt: { $gte: today } }),
    Token.aggregate([
      { $match: { hospitalId: hospitalObjId, waitTime: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$waitTime' } } }
    ])
  ]);

  const last7Days = await Token.aggregate([
    { $match: { hospitalId: hospitalObjId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);

  const hospital = await Hospital.findById(hospitalObjId).select('name');

  return success(res, {
    hospitalName: hospital?.name || 'Unknown Hospital',
    totalDoctors, totalPatients, todayTokens,
    waitingTokens, inProgressTokens, completedToday,
    avgWaitTime: avgWait[0]?.avg?.toFixed(1) || 0,
    last7Days
  });
});

module.exports = { getStats };
