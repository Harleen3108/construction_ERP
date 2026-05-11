import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatINR, formatDate } from '../../utils/format';
import {
  FileText, Download, BarChart3, TrendingUp, Users, Briefcase,
  Receipt, Wallet, ShieldCheck, FileSpreadsheet, Filter, Calendar,
} from 'lucide-react';

const REPORT_TYPES = [
  { key: 'project_status', label: 'Project Status Report', icon: Briefcase, desc: 'Snapshot of all projects with status, progress, budget' },
  { key: 'monthly_progress', label: 'Monthly Progress Report (DPR)', icon: Calendar, desc: 'Departmental progress report for the month' },
  { key: 'financial_summary', label: 'Financial Summary', icon: Wallet, desc: 'Budget allocation vs utilization across projects' },
  { key: 'tender_summary', label: 'Tender Summary', icon: FileText, desc: 'Tenders published, bids received, awards' },
  { key: 'contractor_perf', label: 'Contractor Performance', icon: Users, desc: 'Contractor scorecards · win rate, on-time delivery' },
  { key: 'bills_outstanding', label: 'Bills & Payments Report', icon: Receipt, desc: 'Pending bills, payments released, deductions' },
  { key: 'audit_trail', label: 'Audit Trail Report', icon: ShieldCheck, desc: 'Complete audit log for compliance' },
  { key: 'mb_register', label: 'MB Register', icon: FileSpreadsheet, desc: 'All measurement book entries with approvals' },
];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    api.get('/dept/stats').then((r) => setStats(r.data.data));
  }, []);

  const generate = (type: string) => {
    // Stub — opens print-friendly version of the page.
    // In production this would call /api/reports/:type and stream a PDF.
    alert(`Generating "${type}" report...\n\nThis will export to PDF/Excel in the production build. Backend hook: GET /api/reports/${type}?format=pdf|xlsx`);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate department reports for management, audit, and compliance"
      />

      {/* Quick stats banner */}
      {stats && (
        <div className="card-gov p-4 mb-5 grid grid-cols-2 md:grid-cols-5 gap-4">
          <Mini label="Projects" value={stats.kpi?.totalProjects || 0} icon={Briefcase} />
          <Mini label="Active" value={stats.kpi?.activeProjects || 0} icon={TrendingUp} />
          <Mini label="Total Budget" value={formatINR(stats.kpi?.totalBudget, { compact: true })} icon={Wallet} />
          <Mini label="Tenders" value={stats.kpi?.totalTenders || 0} icon={FileText} />
          <Mini label="Users" value={stats.kpi?.totalUsers || 0} icon={Users} />
        </div>
      )}

      <h3 className="text-sm font-semibold text-slate-700 mb-3">Available Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="card-gov p-5 hover:shadow-gov-lg transition flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-govt-navy/10 text-govt-navy flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{r.label}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">{r.desc}</p>
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
                <button onClick={() => generate(r.key + '_pdf')} className="btn-gov-outline text-[11px] flex-1">
                  <FileText className="w-3 h-3" /> PDF
                </button>
                <button onClick={() => generate(r.key + '_xlsx')} className="btn-gov-outline text-[11px] flex-1">
                  <FileSpreadsheet className="w-3 h-3" /> Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 card-gov p-4 bg-blue-50 border-blue-200 text-xs text-slate-600">
        <strong className="text-govt-navy">Note:</strong> Reports are generated on-demand from live data.
        For scheduled / recurring reports (e.g., daily DPR auto-emailed every morning), configure them under
        <a className="text-govt-navy hover:underline mx-1">Notification Settings</a>.
      </div>
    </div>
  );
}

function Mini({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-slate-400" />
      <div>
        <div className="text-[10px] text-slate-500 uppercase">{label}</div>
        <div className="text-sm font-bold text-slate-800 tabular-nums">{value}</div>
      </div>
    </div>
  );
}
