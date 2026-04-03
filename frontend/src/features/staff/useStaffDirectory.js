import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { roleLabel } from './staffRoleConfig';
import { summarizeDoctorSchedule } from '../../utils/summarizeDoctorSchedule';

function normalizeStaffPayload(staff, roleCounts, count) {
  const withLabels = (staff || []).map((row) => ({
    ...row,
    roleLabel: roleLabel(row.role),
  }));
  return {
    staff: withLabels,
    roleCounts: roleCounts || {},
    count: count ?? withLabels.length,
  };
}

function mapDoctorToStaffRow(d) {
  return {
    kind: 'doctor',
    _id: d._id,
    role: 'doctor',
    name: d.name,
    email: d.email || '',
    phone: d.phone || '',
    isActive: !!d.isAvailable,
    assignment: d.specialization || '—',
    shiftSummary: summarizeDoctorSchedule(d.schedule),
    meta: { specialization: d.specialization, consultationFee: d.consultationFee },
  };
}

function normalizeApiDoctorRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    if (row.kind === 'doctor' && row.role === 'doctor') {
      return {
        ...row,
        shiftSummary: row.shiftSummary || '—',
        meta: row.meta || {},
      };
    }
    return mapDoctorToStaffRow(row);
  });
}

/**
 * Doctors come from the same GET /doctors endpoint as Admin → Doctors.
 * Other roles come from GET /staff (personnel records).
 * Requests are independent so a failing /staff still shows doctors, and vice versa.
 */
export function useStaffDirectory() {
  return useQuery({
    queryKey: ['staff', 'directory'],
    queryFn: async () => {
      const [doctorsOutcome, staffOutcome] = await Promise.allSettled([
        api.get('/doctors'),
        api.get('/staff'),
      ]);

      let doctors = [];
      if (doctorsOutcome.status === 'fulfilled') {
        const list = doctorsOutcome.value.data?.data?.doctors;
        doctors = (list || []).map(mapDoctorToStaffRow);
      }

      let personnel = [];
      let staffDoctorsFallback = [];

      if (staffOutcome.status === 'fulfilled') {
        const rawStaff = staffOutcome.value.data?.data?.staff || [];
        personnel = rawStaff.filter((row) => row.kind === 'personnel');
        staffDoctorsFallback = normalizeApiDoctorRows(
          rawStaff.filter((row) => row.kind === 'doctor'),
        );
      }

      if (doctorsOutcome.status === 'rejected' && staffOutcome.status === 'rejected') {
        throw doctorsOutcome.reason || new Error('Could not load staff directory');
      }

      if (doctors.length === 0 && staffDoctorsFallback.length > 0) {
        doctors = staffDoctorsFallback;
      }

      const staff = [...doctors, ...personnel].sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }),
      );

      const roleCounts = staff.reduce((acc, row) => {
        acc[row.role] = (acc[row.role] || 0) + 1;
        return acc;
      }, {});

      const warnings = [];
      if (doctorsOutcome.status === 'rejected') warnings.push('doctors');
      if (staffOutcome.status === 'rejected') warnings.push('personnel');

      return {
        ...normalizeStaffPayload(staff, roleCounts, staff.length),
        partialLoad: warnings.length > 0,
        loadWarnings: warnings,
      };
    },
  });
}
