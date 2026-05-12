import { useEffect, useState } from 'react';
import api from '../../api/client';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  Mail, CheckCircle2, XCircle, AlertTriangle, Send, RefreshCw, Settings,
} from 'lucide-react';

export default function EmailDiagnosticsPage() {
  const [diag, setDiag] = useState<any>(null);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const load = () => {
    api.get('/system/email-diagnostics').then((r) => setDiag(r.data.data));
  };
  useEffect(() => { load(); }, []);

  const test = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTo) return;
    setTesting(true);
    setLastResult(null);
    try {
      const r = await api.post('/system/test-email', { to: testTo });
      setLastResult(r.data);
      if (r.data.success) toast.success('Test email sent — check inbox + spam folder');
      else toast.error(r.data.data?.error || 'Email failed — see details below');
    } catch (err: any) {
      setLastResult({ success: false, data: { error: err.response?.data?.message || err.message } });
    } finally { setTesting(false); }
  };

  if (!diag) return <div className="p-12 text-center text-slate-400">Loading SMTP diagnostics...</div>;

  return (
    <div>
      <PageHeader
        title="Email Diagnostics"
        subtitle="Diagnose and test SMTP / email delivery"
        actions={
          <button onClick={load} className="btn-gov-outline text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Reload Config
          </button>
        }
      />

      {/* Active provider banner */}
      <div className={`card-gov p-4 mb-5 flex items-center gap-3 ${
        diag.activeProvider === 'resend' ? 'bg-green-50 border-green-300' :
        diag.activeProvider === 'smtp' ? 'bg-amber-50 border-amber-300' :
        'bg-red-50 border-red-300'
      }`}>
        <Mail className={`w-6 h-6 ${
          diag.activeProvider === 'resend' ? 'text-govt-green' :
          diag.activeProvider === 'smtp' ? 'text-amber-600' : 'text-erp-danger'
        }`} />
        <div className="flex-1">
          <div className="font-semibold text-sm">Active Provider: <span className="uppercase">{diag.activeProvider}</span></div>
          <div className="text-xs mt-0.5">{diag.providerStatus}</div>
        </div>
      </div>

      {/* Configuration status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card-gov">
          <div className="card-gov-header flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <h3 className="font-semibold text-sm">Provider Configuration</h3>
          </div>
          <div className="p-5 space-y-2 text-sm">
            <div className="text-[10px] uppercase text-slate-500 font-semibold mt-1 pb-1 border-b border-slate-200">Resend (HTTPS)</div>
            <ConfigRow label="API Key Set" value={diag.resendConfigured ? '✓ Yes' : '✗ Not set'} color={diag.resendConfigured ? 'text-govt-green' : 'text-slate-500'} />
            <ConfigRow label="From Address" value={diag.resendFrom} />

            <div className="text-[10px] uppercase text-slate-500 font-semibold mt-3 pb-1 border-b border-slate-200">Brevo / Sendinblue (HTTPS)</div>
            <ConfigRow label="API Key Set" value={diag.brevoConfigured ? '✓ Yes' : '✗ Not set'} color={diag.brevoConfigured ? 'text-govt-green' : 'text-slate-500'} />
            <ConfigRow label="From Address" value={diag.brevoFrom} highlight={diag.brevoConfigured && diag.brevoFrom?.includes('NOT SET')} />

            <div className="text-[10px] uppercase text-slate-500 font-semibold mt-3 pb-1 border-b border-slate-200">SMTP (Fallback)</div>
            <ConfigRow label="Configured" value={diag.smtpConfigured ? '✓ Yes' : '✗ No'} color={diag.smtpConfigured ? 'text-slate-700' : 'text-slate-400'} />
            <ConfigRow label="Host" value={diag.host} />
            <ConfigRow label="Port" value={diag.port} highlight={diag.port === '587'} />
            <ConfigRow label="Secure (SSL)" value={diag.secure ? '✓ Yes' : '✗ No'} />
            <ConfigRow label="User" value={diag.user} />
            <ConfigRow label="Password Set" value={diag.passSet ? '✓ Yes' : '✗ NOT SET'} color={diag.passSet ? 'text-govt-green' : 'text-erp-danger'} />

            <div className="text-[10px] uppercase text-slate-500 font-semibold mt-3 pb-1 border-b border-slate-200">App Config</div>
            <ConfigRow label="Client URL" value={diag.clientUrl} highlight={diag.clientUrl?.includes('localhost')} />
            <ConfigRow label="Environment" value={diag.nodeEnv} />
          </div>
        </div>

        <div className="card-gov">
          <div className="card-gov-header flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-sm">Recommendations</h3>
          </div>
          <div className="p-5 space-y-2">
            {diag.recommendations?.length > 0 ? (
              diag.recommendations.map((r: string, i: number) => (
                <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-900">
                  {r}
                </div>
              ))
            ) : (
              <div className="text-xs text-govt-green flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> No issues detected with configuration
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <strong>For Gmail on Render/Railway/cloud hosts:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-0.5">
                <li>Use <code className="bg-slate-100 px-1">SMTP_PORT=465</code> with <code className="bg-slate-100 px-1">SMTP_SECURE=true</code></li>
                <li>Port 587 is blocked on most cloud free tiers</li>
                <li>Use a 16-character <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-govt-navy hover:underline">Gmail App Password</a> — not your regular password</li>
                <li>Enable 2FA on the Gmail account first</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test email form */}
      <div className="card-gov">
        <div className="card-gov-header flex items-center gap-2">
          <Mail className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Send Test Email</h3>
        </div>
        <form onSubmit={test} className="p-5">
          <p className="text-xs text-slate-500 mb-3">
            Enter a real email address you have access to. We'll attempt to send a test message and show you the exact result (success message ID or full error).
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              required
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="your-real-email@gmail.com"
              className="input-gov flex-1"
            />
            <button disabled={testing} className="btn-gov">
              <Send className="w-4 h-4" /> {testing ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </form>

        {/* Result display */}
        {lastResult && (
          <div className={`mx-5 mb-5 rounded p-4 ${lastResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-govt-green flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-erp-danger flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${lastResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {lastResult.success ? 'Email Sent Successfully' : 'Email Failed to Send'}
                </div>
                <div className="text-xs mt-1">{lastResult.message}</div>
                {lastResult.data?.messageId && (
                  <div className="text-[10px] font-mono mt-2 text-slate-600 break-all">
                    Message ID: {lastResult.data.messageId}
                  </div>
                )}
                {lastResult.data?.error && (
                  <div className="mt-2 p-2 bg-white rounded font-mono text-[11px] text-red-700 break-all">
                    {lastResult.data.error}
                  </div>
                )}
                {lastResult.success && (
                  <div className="text-[11px] text-slate-600 mt-2">
                    Check inbox AND spam folder. Gmail sometimes routes first-time senders to spam.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Common issues guide */}
      <div className="card-gov mt-5 p-5 text-xs text-slate-700">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Issues
        </h3>
        <ol className="list-decimal ml-5 space-y-2">
          <li>
            <strong>Email not arriving:</strong> Check your spam folder. Gmail often marks first-time senders from generic SMTP as spam.
            Mark as "Not Spam" once, and future emails arrive in inbox.
          </li>
          <li>
            <strong>"Auth failed" error:</strong> Your <code className="bg-slate-100 px-1">SMTP_PASS</code> is wrong. For Gmail, you need a 16-character
            App Password, not your regular password. <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-govt-navy hover:underline">Generate one here</a>.
          </li>
          <li>
            <strong>"Connection timeout" on cloud host:</strong> Port 587 is often blocked on free tiers (Render, Railway, etc.).
            Switch to <code className="bg-slate-100 px-1">SMTP_PORT=465</code> and <code className="bg-slate-100 px-1">SMTP_SECURE=true</code> in your environment variables and redeploy.
          </li>
          <li>
            <strong>Reset link points to localhost:</strong> The <code className="bg-slate-100 px-1">CLIENT_URL</code> env var is not set on your production backend.
            Set it to your live frontend URL (e.g., <code className="bg-slate-100 px-1">https://yourapp.vercel.app</code>).
          </li>
          <li>
            <strong>Gmail rate limit:</strong> Free Gmail accounts can send ~100 emails/day. For production scale, use a transactional service like SendGrid, Mailgun, or AWS SES.
          </li>
        </ol>
      </div>
    </div>
  );
}

function ConfigRow({ label, value, color, highlight }: any) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 ${highlight ? 'bg-amber-50 -mx-2 px-2 rounded' : ''}`}>
      <span className="text-[12px] text-slate-600">{label}</span>
      <span className={`text-[12px] font-mono ${color || 'text-slate-800'}`}>{value || '—'}</span>
    </div>
  );
}
