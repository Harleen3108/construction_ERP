import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate, formatINR } from '../../utils/format';
import toast from 'react-hot-toast';
import { ArrowLeft, FileCheck, CheckCircle2 } from 'lucide-react';

export default function SubmitBidPage() {
  const { tenderId } = useParams();
  const nav = useNavigate();
  const [tender, setTender] = useState<any>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [bid, setBid] = useState<any>(null);
  const [techDocs, setTechDocs] = useState([
    { name: 'Company Profile', url: '', checked: false },
    { name: 'Experience Certificates', url: '', checked: false },
    { name: 'GST Certificate', url: '', checked: false },
    { name: 'Machinery Details', url: '', checked: false },
  ]);
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/tenders/${tenderId}`).then((r) => setTender(r.data.data));
  }, [tenderId]);

  const submitTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techDocs.every((d) => d.checked)) {
      return toast.error('Please confirm all required documents');
    }
    setLoading(true);
    try {
      const docs = techDocs.map((d) => ({ name: d.name, url: d.url || 'placeholder' }));
      const res = await api.post('/bids/technical', { tender: tenderId, technicalDocuments: docs });
      setBid(res.data.data);
      toast.success('Technical bid submitted');
      setStep(2);
    } finally { setLoading(false); }
  };

  const submitFinancial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/bids/${bid._id}/financial`, { quotedAmount: Number(quote) });
      toast.success('Financial bid submitted');
      nav('/bids');
    } finally { setLoading(false); }
  };

  if (!tender) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title="Submit Bid"
        subtitle={`Stage 5 · ${tender.title}`}
        stage={5}
        actions={<Link to="/tenders/published" className="btn-gov-outline"><ArrowLeft className="w-4 h-4" /> Back</Link>}
      />

      <div className="card-gov p-5 mb-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-xs text-slate-500">Tender ID</div><div className="font-mono text-sm">{tender.tenderId}</div></div>
        <div><div className="text-xs text-slate-500">Estimated Cost</div><div className="font-medium">{formatINR(tender.estimatedCost, { compact: true })}</div></div>
        <div><div className="text-xs text-slate-500">EMD</div><div className="font-medium">{formatINR(tender.emd, { compact: true })}</div></div>
        <div><div className="text-xs text-slate-500">Last Date</div><div className="font-medium">{formatDate(tender.bidSubmissionEndDate)}</div></div>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-5 gap-2">
        <div className={`flex-1 p-3 rounded-lg border-2 ${step === 1 ? 'border-govt-navy bg-blue-50' : 'border-green-300 bg-green-50'}`}>
          <div className="flex items-center gap-2">
            {step === 1 ? <span className="w-6 h-6 bg-govt-navy text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                       : <CheckCircle2 className="w-5 h-5 text-govt-green" />}
            <span className="font-semibold">Technical Bid</span>
          </div>
        </div>
        <div className="w-8 h-0.5 bg-slate-300" />
        <div className={`flex-1 p-3 rounded-lg border-2 ${step === 2 ? 'border-govt-navy bg-blue-50' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-govt-navy text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span className={`font-semibold ${step === 2 ? '' : 'text-slate-400'}`}>Financial Bid</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={submitTech} className="card-gov p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><FileCheck className="w-5 h-5 text-govt-navy" /> Required Documents</h3>
          <p className="text-sm text-slate-500 mb-4">Confirm submission of the following technical documents.</p>
          <div className="space-y-2">
            {techDocs.map((d, i) => (
              <label key={i} className="flex items-center gap-3 p-3 border rounded hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={d.checked}
                       onChange={() => setTechDocs((cur) => cur.map((x, idx) => idx === i ? { ...x, checked: !x.checked } : x))} />
                <span className="text-sm font-medium flex-1">{d.name}</span>
                {d.checked && <CheckCircle2 className="w-4 h-4 text-govt-green" />}
              </label>
            ))}
          </div>
          <button disabled={loading} className="btn-gov mt-5 w-full">
            {loading ? 'Submitting...' : 'Submit Technical Bid'}
          </button>
        </form>
      ) : (
        <form onSubmit={submitFinancial} className="card-gov p-6 max-w-2xl">
          <h3 className="font-semibold mb-3">Financial Quote</h3>
          <p className="text-sm text-slate-500 mb-4">Estimated cost is {formatINR(tender.estimatedCost)}. Enter your quoted amount.</p>
          <label className="label-gov">My Quoted Amount (₹) *</label>
          <input required type="number" className="input-gov text-2xl" value={quote} onChange={(e) => setQuote(e.target.value)}
                 placeholder="48500000" />
          {quote && <p className="text-xs text-slate-500 mt-1">≈ {(Number(quote) / 1e7).toFixed(2)} Crore</p>}
          <button disabled={loading} className="btn-gov mt-5 w-full">
            {loading ? 'Submitting...' : 'Submit Financial Bid'}
          </button>
        </form>
      )}
    </div>
  );
}
