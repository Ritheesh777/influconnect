import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Field } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const HOME = { admin: '/admin', company: '/company', creator: '/creator' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('creator'); // guides the "sign up" link + side art only
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // No role is sent — the server returns the account's real role (creator,
      // company, or admin) and we route accordingly. One login for everyone.
      const user = await login(form);
      toast.success('Welcome back!');
      const dest = location.state?.from?.pathname || HOME[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Collably account." side={role}>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1">
        {['creator', 'company'].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
              role === r ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600">
            Forgot password?
          </Link>
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don't have an account?{' '}
        <Link to={`/register/${role}`} className="font-semibold text-brand-600">
          Sign up as {role}
        </Link>
      </p>
    </AuthShell>
  );
}
