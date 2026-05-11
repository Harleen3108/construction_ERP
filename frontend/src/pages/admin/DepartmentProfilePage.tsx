import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatINR } from '../../utils/format';
import { Building2 } from 'lucide-react';

export default function DepartmentProfilePage() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { api.get('/departments/me').then((r) => setD(r.data.data)); }, []);
  if (!d) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader title="My Department" subtitle="Department profile, modules, and subscription" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-gov">
          <div className="card-gov-header flex items-center gap-2">
            <Building2 className="w-4 h-4 text-govt-navy" />
            <h3 className="font-semibold">{d.name}</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4 text-sm">
            <D label="Code" v={d.code} />
            <D label="Type" v={d.type} />
            <D label="State" v={d.state} />
            <D label="City" v={d.city} />
            <D label="Head" v={d.headOfDepartment} />
            <D label="Status" v={d.status} />
            <D label="Contact" v={d.contactEmail} />
            <D label="Phone" v={d.contactPhone} />
            <D label="Total Users" v={d.userCount} />
            <D label="Total Projects" v={d.projectCount} />
          </div>
        </div>

        <div className="space-y-4">
          {d.subscription && (
            <div className="card-gov p-5 bg-gradient-to-br from-blue-50 to-white">
              <div className="text-xs text-slate-500 uppercase">Active Subscription</div>
              <div className="text-2xl font-bold text-govt-navy mt-1">{d.subscription.plan}</div>
              <div className="mt-2 text-sm">{formatINR(d.subscription.amount)}/yr</div>
              <div className="text-xs text-slate-500 mt-1">
                Valid till {formatDate(d.subscription.endDate)}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-slate-500">Max Users</div><div className="font-semibold">{d.subscription.maxUsers || '∞'}</div></div>
                <div><div className="text-slate-500">Max Projects</div><div className="font-semibold">{d.subscription.maxProjects || '∞'}</div></div>
              </div>
            </div>
          )}

          <div className="card-gov p-5">
            <div className="text-xs text-slate-500 uppercase mb-2">Enabled Modules</div>
            <div className="space-y-1">
              {(d.enabledModules || []).map((m: string) => (
                <div key={m} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-govt-green" />
                  <span className="capitalize">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const D = ({ label, v }: any) => (
  <div><div className="text-xs text-slate-500 uppercase">{label}</div><div className="font-medium mt-0.5">{v ?? '—'}</div></div>
);
