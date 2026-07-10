import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Field } from '../../components/ui.jsx';
import { authApi } from '../../api/endpoints.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try {
      await authApi.resetPassword(token, form.password);
      toast.success('Password reset! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you'll remember.">
      {!token ? (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          Missing reset token. Please use the link from your email.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New Password">
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" className="input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-brand-600">← Back to login</Link>
      </p>
    </AuthShell>
  );
}
