import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Building2, Lock, CheckCircle2, XCircle, Loader2, KeyRound } from 'lucide-react';

export default function SetPasswordPage() {
  const { token } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const isReset = location.pathname.startsWith('/reset-password');

  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [tokenUser, setTokenUser] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setValid(false);
      setVerifying(false);
      return;
    }
    api.get(`/auth/verify-token/${token}`)
      .then((r) => { setValid(true); setTokenUser(r.data.data); })
      .catch(() => setValid(false))
      .finally(() => setVerifying(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setSubmitting(true);
    try {
      await api.post('/auth/set-password', { token, password });
      toast.success(isReset ? 'Password reset! You can now log in.' : 'Password set! You can now log in.');
      setTimeout(() => nav('/login'), 1200);
    } finally { setSubmitting(false); }
  };

  // Copy that changes based on the route
  const copy = isReset
    ? {
        title: 'Reset Your Password',
        intro: 'Enter a new password below. After saving, you can log in with the new password.',
        successHeading: `Hello ${tokenUser?.name || ''}`,
        button: 'Reset Password',
        submittingText: 'Resetting...',
        invalidMessage: 'This reset link has expired or is invalid. Please request a new one from the login page.',
      }
    : {
        title: 'Activate Your Account',
        intro: 'Your organization has been approved. Set your password to activate your account.',
        successHeading: `Welcome, ${tokenUser?.name || ''}!`,
        button: 'Set Password & Activate Account',
        submittingText: 'Setting password...',
        invalidMessage: 'This password setup link has expired or is invalid. Please contact your Super Admin or request a new one.',
      };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="h-1 tricolor-strip" />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-md border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-full bg-govt-navy text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Government of India</div>
              <div className="font-bold text-govt-navy">Constructor ERP</div>
            </div>
          </div>

          {verifying ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-govt-navy mx-auto mb-3" />
              <p className="text-sm text-slate-500">Verifying link...</p>
            </div>
          ) : !valid ? (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 text-erp-danger mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">Invalid or Expired Link</h2>
              <p className="text-sm text-slate-500 mb-5">{copy.invalidMessage}</p>
              <div className="space-y-2">
                {isReset && (
                  <Link to="/forgot-password" className="btn-gov w-full">Request New Reset Link</Link>
                )}
                <Link to="/login" className="btn-gov-outline w-full">Back to Login</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                {isReset ? (
                  <KeyRound className="w-8 h-8 text-govt-navy" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-govt-green" />
                )}
                <h2 className="text-xl font-bold text-slate-800">{copy.title}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-5">{copy.successHeading} — {copy.intro}</p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-5 text-xs">
                <div className="text-slate-500">Email</div>
                <div className="font-medium text-slate-800">{tokenUser?.email}</div>
                {tokenUser?.role && (
                  <>
                    <div className="text-slate-500 mt-2">Role</div>
                    <div className="font-medium text-govt-navy">{tokenUser.role.replace(/_/g, ' ')}</div>
                  </>
                )}
              </div>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label-gov">New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required minLength={6}
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-gov pl-9"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-gov">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="input-gov pl-9"
                      placeholder="Re-enter password"
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-[11px] text-erp-danger mt-1">Passwords don't match</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting || (!!confirm && password !== confirm)}
                  className="btn-gov w-full"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? copy.submittingText : copy.button}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
