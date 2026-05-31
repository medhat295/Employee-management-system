import { useEffect, useMemo, useState } from 'react';
import { FileText, Printer, Search, X } from 'lucide-react';
import api from '../api/axios';
import type { Company, Department, Employee } from '../types';
import { formatDate } from '../utils/format';
import { TableSkeletonRow } from '../components/ui/TableSkeleton';

// ── Print CSS ─────────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @media print {
    @page { size: landscape; margin: 1.5cm; }
    body, html { overflow: visible !important; }
    body * { visibility: hidden; }
    #report-print, #report-print * { visibility: visible; }
    #report-print {
      position: absolute; top: 0; left: 0; width: 100%;
      background: white; border: none !important;
      box-shadow: none !important; border-radius: 0 !important;
    }
    .print-only  { display: block !important; }
    .no-print    { display: none  !important; }
    .avatar-hide { display: none  !important; }
    #report-print table { border-collapse: collapse; width: 100%; font-size: 11px; }
    #report-print th,
    #report-print td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }
    #report-print th { background-color: #f9fafb !important; font-weight: 600;
      -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDaysEmployed(days: number): string {
  if (days < 365) return `${days} days`;
  const y = Math.floor(days / 365);
  const m = Math.floor((days % 365) / 30);
  return m ? `${y}y ${m}mo` : `${y}y`;
}

const COL_WIDTHS = ['w-44', 'w-40', 'w-28', 'w-24', 'w-24', 'w-20', 'w-32', 'w-28'];

// ── Page ──────────────────────────────────────────────────────────────────────

export function EmployeeReportPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepts]   = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);

  const [search, setSearch]               = useState('');
  const [companyFilter, setCompanyFilter] = useState<number | ''>('');
  const [deptFilter, setDeptFilter]       = useState<number | ''>('');

  useEffect(() => {
    Promise.all([
      api.get<Company[]>('/companies/').then(r => setCompanies(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get<Department[]>('/departments/').then(r => setDepts(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get<Employee[]>('/employees/').then(r => setEmployees(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c.name])), [companies]);
  const deptMap    = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);

  const visibleDepts = useMemo(
    () => (companyFilter ? departments.filter(d => d.company_id === +companyFilter) : departments),
    [departments, companyFilter],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(emp => {
      if (emp.status !== 'active') return false;
      if (q && !emp.name.toLowerCase().includes(q)) return false;
      if (companyFilter && emp.company_id !== +companyFilter) return false;
      if (deptFilter && emp.department_id !== +deptFilter) return false;
      return true;
    });
  }, [employees, search, companyFilter, deptFilter]);

  const hasFilters   = !!(search || companyFilter || deptFilter);
  const printedOn    = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const filterLabel  = [
    companyFilter ? companyMap.get(+companyFilter) : null,
    deptFilter ? deptMap.get(+deptFilter) : null,
    search ? `"${search}"` : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="no-print flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2D3B55]">Employee Report</h1>
              <p className="text-sm text-gray-500">
                Active employees only
                {!loading && <> · <span className="font-semibold text-[#2D3B55]">{filtered.length}</span> record{filtered.length !== 1 ? 's' : ''}</>}
              </p>
            </div>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2D3B55] text-white text-sm font-semibold
              rounded-xl hover:bg-[#22C55E] transition-colors duration-200 flex-shrink-0">
            <Printer className="w-4 h-4" />
            Print / Export
          </button>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────── */}
        <div className="no-print bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center gap-3">

          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text" placeholder="Search by name…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30
                focus:border-[#22C55E] transition-shadow"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select value={companyFilter}
            onChange={e => { setCompanyFilter(e.target.value ? +e.target.value : ''); setDeptFilter(''); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 min-w-40
              focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition-shadow">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={deptFilter}
            onChange={e => setDeptFilter(e.target.value ? +e.target.value : '')}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 min-w-44
              focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30 focus:border-[#22C55E] transition-shadow">
            <option value="">All Departments</option>
            {visibleDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          {hasFilters && (
            <button onClick={() => { setSearch(''); setCompanyFilter(''); setDeptFilter(''); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200
                rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

        </div>

        {/* ── Printable report ────────────────────────────────────── */}
        <div id="report-print" className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Print-only header */}
          <div className="print-only hidden px-6 pt-5 pb-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Employee Report</h1>
                <p className="text-sm text-gray-600 mt-0.5">Active Employees Only</p>
                {filterLabel && <p className="text-xs text-gray-500 mt-1">Filters: {filterLabel}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">eBen Employee Management</p>
                <p className="text-xs text-gray-500 mt-0.5">Printed: {printedOn}</p>
                <p className="text-xs text-gray-500">{filtered.length} active employee{filtered.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  {['Name','Email','Mobile','Position / Title','Hired On','Days Employed','Company','Department'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <TableSkeletonRow key={i} cols={8} widths={COL_WIDTHS} />)
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-300" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-500">No active employees found</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {hasFilters ? 'Try adjusting your filters' : 'No employees have an active status yet'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                    : filtered.map((emp, idx) => {
                        const initials = emp.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                        return (
                          <tr key={emp.id}
                            className={['border-b border-gray-50 transition-colors hover:bg-emerald-50/30',
                              idx % 2 !== 0 ? 'bg-gray-50/30' : 'bg-white',
                            ].join(' ')}>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="avatar-hide w-8 h-8 rounded-full bg-[#2D3B55] flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-[10px] font-bold leading-none">{initials}</span>
                                </div>
                                <span className="font-medium text-[#2D3B55] whitespace-nowrap">{emp.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600"><span className="block max-w-[180px] truncate">{emp.email}</span></td>
                            <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{emp.mobile}</td>
                            <td className="px-4 py-3.5 text-gray-600">{emp.title}</td>
                            <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(emp.hire_date)}</td>
                            <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap tabular-nums font-medium">{formatDaysEmployed(emp.days_employed)}</td>
                            <td className="px-4 py-3.5 text-gray-600">{companyMap.get(emp.company_id) ?? '—'}</td>
                            <td className="px-4 py-3.5 text-gray-600">{deptMap.get(emp.department_id) ?? '—'}</td>
                          </tr>
                        );
                      })
                }
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/40 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-[#2D3B55]">{filtered.length}</span> active employee{filtered.length !== 1 ? 's' : ''}
              </p>
              <p className="no-print text-xs text-gray-400">Employee Report · eBen</p>
            </div>
          )}

        </div>

      </div>
    </>
  );
}
