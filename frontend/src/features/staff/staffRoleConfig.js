/** Unified staff directory roles (doctors come from /api/doctors; others from StaffMember). */
export const STAFF_ROLE_FILTERS = [
  { id: 'all', label: 'All', short: 'All' },
  { id: 'doctor', label: 'Doctors', short: 'MD', emoji: '👨‍⚕️', hint: 'Migrated from Doctors' },
  { id: 'nurse', label: 'Nurses', short: 'RN', emoji: '👩‍⚕️', hint: 'Ward assigned' },
  { id: 'driver', label: 'Drivers', short: 'DRV', emoji: '🚑', hint: 'Ambulance linked' },
  { id: 'cleaner', label: 'Cleaners', short: 'CLN', emoji: '🧹', hint: 'Zone assigned' },
  { id: 'pharmacist', label: 'Pharmacists', short: 'RX', emoji: '💊', hint: 'Pharmacy wing' },
  { id: 'lab_tech', label: 'Lab Tech', short: 'LAB', emoji: '🔬', hint: 'Lab assigned' },
  { id: 'security', label: 'Security', short: 'SEC', emoji: '🛡️', hint: 'Gate / floor' },
  { id: 'reception', label: 'Reception', short: 'REC', emoji: '📁', hint: 'Front desk' },
];

export const PERSONNEL_ROLES = STAFF_ROLE_FILTERS.filter((r) => r.id !== 'all' && r.id !== 'doctor');

export function roleLabel(roleId) {
  const r = STAFF_ROLE_FILTERS.find((x) => x.id === roleId);
  return r?.label || roleId;
}
