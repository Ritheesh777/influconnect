import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Field } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login({ ...form, role: 'admin' });
      toast.success('Welcome, Admin');
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Admin Login" subtitle="Platform administration access." side="admin">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password">
          <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-brand-600">← User login</Link>
      </p>
    </AuthShell>
  );
}
