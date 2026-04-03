import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = true,
  pageSize = 10,
  emptyMessage = 'No records found',
}) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
    setPage(1);
  };

  let filtered = data;

  if (search) {
    const q = search.toLowerCase();
    filtered = data.filter(row =>
      columns.some(col => {
        const val = col.accessor ? row[col.accessor] : '';
        return String(val || '').toLowerCase().includes(q);
      })
    );
  }

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[sortCol] ?? '';
      const bVal = b[sortCol] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const total = filtered.length;
  const pages = Math.ceil(total / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card overflow-hidden">
      {searchable && (
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input pl-8 py-1.5 text-sm"
            />
          </div>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            {total} record{total !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F2937' }}>
              {columns.map(col => (
                <th
                  key={col.key || col.accessor}
                  onClick={() => col.sortable !== false && col.accessor && handleSort(col.accessor)}
                  className="px-4 py-3 text-left font-semibold select-none"
                  style={{
                    color: '#6B7280',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    background: '#0F1623',
                  }}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.accessor && sortCol === col.accessor
                      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      : null
                    }
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a2234' }}>
                  {columns.map((_, ci) => (
                    <td key={ci} className="px-4 py-3">
                      <div className="h-4 rounded animate-pulse" style={{ background: '#1F2937', width: `${60 + ci * 10}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center" style={{ color: '#6B7280' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={row._id || i}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #1a2234' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#111827'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {columns.map(col => (
                    <td key={col.key || col.accessor} className="px-4 py-3" style={{ color: '#D1D5DB' }}>
                      {col.render ? col.render(row) : row[col.accessor] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1F2937' }}>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            Page {page} of {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-secondary py-1.5 px-2.5"
              style={{ fontSize: '12px', opacity: page === 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn btn-secondary py-1.5 px-2.5"
              style={{ fontSize: '12px', opacity: page === pages ? 0.4 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
