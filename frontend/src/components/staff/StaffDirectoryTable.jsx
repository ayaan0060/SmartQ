import React from 'react';
import { Pencil, UserX, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import DataTable from '../ui/DataTable';

export default function StaffDirectoryTable({
  rows,
  loading,
  errorMessage,
  onEditDoctor,
  onEditPersonnel,
  onDeactivatePersonnel,
  onToggleDoctorAvailability,
  onDeleteDoctor,
}) {
  if (errorMessage) {
    return (
      <div
        className="rounded-xl px-4 py-8 text-center text-sm"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
      >
        {errorMessage}
      </div>
    );
  }

  const columns = [
    {
      header: 'Staff',
      accessor: 'name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
          >
            {r.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white text-sm">{r.name}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {r.email || r.phone || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'roleLabel',
      render: (r) => (
        <span className="badge badge-primary" style={{ fontSize: '11px' }}>
          {r.roleLabel}
        </span>
      ),
    },
    {
      header: 'Assignment',
      accessor: 'assignment',
      render: (r) => <span style={{ color: '#9CA3AF' }}>{r.assignment}</span>,
    },
    {
      header: 'Shift',
      accessor: 'shiftSummary',
      render: (r) => (
        <span className="text-xs max-w-[200px] inline-block align-top" style={{ color: '#9CA3AF' }}>
          {r.shiftSummary}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (r) => (
        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.kind === 'doctor' ? (
            <>
              <button
                type="button"
                className="btn btn-ghost py-1 px-2 text-xs"
                onClick={() => onToggleDoctorAvailability?.(r)}
                title="Toggle availability"
              >
                {r.isActive ? (
                  <ToggleRight size={16} style={{ color: '#10B981' }} />
                ) : (
                  <ToggleLeft size={16} style={{ color: '#6B7280' }} />
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost py-1 px-2 text-xs"
                onClick={() => onEditDoctor?.(r)}
                title="Edit doctor"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="btn btn-danger py-1 px-2 text-xs"
                onClick={() => onDeleteDoctor?.(r)}
                title="Remove doctor"
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost py-1 px-2 text-xs"
                onClick={() => onEditPersonnel?.(r)}
                title="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="btn btn-ghost py-1 px-2 text-xs"
                onClick={() => onDeactivatePersonnel?.(r)}
                title="Deactivate"
                disabled={!r.isActive}
                style={{ opacity: !r.isActive ? 0.4 : 1 }}
              >
                <UserX size={13} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      emptyMessage="No staff match this filter. Try another role or add staff."
    />
  );
}
