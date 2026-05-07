import { Link } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import { ClipboardList, Scale, Award } from 'lucide-react';

export default function TenderOfficerDashboard() {
  return (
    <div>
      <PageHeader title="Tender Officer Dashboard" subtitle="Create tenders · Evaluate bids · Award contracts" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/tenders/new" className="card-gov p-6 hover:shadow-gov-lg transition">
          <ClipboardList className="w-7 h-7 text-govt-navy mb-3" />
          <div className="font-semibold">Create Tender</div>
          <p className="text-sm text-slate-500">Stage 3 · Create from sanctioned project</p>
        </Link>
        <Link to="/bids/evaluate" className="card-gov p-6 hover:shadow-gov-lg transition">
          <Scale className="w-7 h-7 text-govt-navy mb-3" />
          <div className="font-semibold">Bid Evaluation</div>
          <p className="text-sm text-slate-500">Stage 6 · Identify L1 bidder</p>
        </Link>
        <Link to="/work-orders" className="card-gov p-6 hover:shadow-gov-lg transition">
          <Award className="w-7 h-7 text-govt-navy mb-3" />
          <div className="font-semibold">Work Orders</div>
          <p className="text-sm text-slate-500">Stage 7 · Generate LOA & WO</p>
        </Link>
      </div>
    </div>
  );
}
