import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Field } from '../../components/ui.jsx';
import { authApi } from '../../api/endpoints.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      if (res.devToken) setDevToken(res.devToken); // dev convenience (no email service yet)
      toast.success('If that email exists, a reset link was sent.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send a reset link.">
      {sent ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Check your inbox for a reset link.
          {devToken && (
            <p className="mt-2 break-all text-xs text-slate-500">
              Dev link:{' '}
              <Link to={`/reset-password?token=${devToken}`} className="text-brand-600 underline">
                /reset-password?token=…
              </Link>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-brand-600">← Back to login</Link>
      </p>
    </AuthShell>
  );
}
