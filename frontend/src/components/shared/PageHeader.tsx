import { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  stage?: number;
  actions?: ReactNode;
  badge?: string;
}

export default function PageHeader({ title, subtitle, stage, actions, badge }: Props) {
  return (
    <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          {stage && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-govt-navy text-white">
              STAGE {stage}
            </span>
          )}
          {badge && <span className="pill pill-info">{badge}</span>}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 font-gov mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
