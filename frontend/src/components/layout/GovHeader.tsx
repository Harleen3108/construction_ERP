import { Building2 } from 'lucide-react';

export default function GovHeader() {
  return (
    <>
      {/* Tricolor strip */}
      <div className="h-1 tricolor-strip" />

      {/* Top emblem header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-govt-navy flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-xs text-slate-500 font-medium">Government of India</div>
              <div className="text-sm md:text-base font-bold text-govt-navy font-gov">
                Construction ERP & Internal eTender System
              </div>
              <div className="text-[10px] text-slate-400 hidden md:block">
                Public Works Department · सत्यमेव जयते
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-600">
            <span className="font-medium">Skip to Main Content</span>
            <span className="border-l h-4 border-slate-300" />
            <span>Screen Reader Access</span>
            <span className="border-l h-4 border-slate-300" />
            <select className="bg-transparent text-xs">
              <option>English</option>
              <option>हिंदी</option>
            </select>
          </div>
        </div>
      </header>
    </>
  );
}
