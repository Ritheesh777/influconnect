import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../../components/AuthShell.jsx';
import { Field } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { INDUSTRIES } from '../../utils/constants.js';

export default function RegisterCompany() {
  const { registerCompany } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    industry: 'Restaurant',
    city: '',
    state: '',
    country: '',
    acceptTerms: false,
  });

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (form.password !== form.confirmPassword)
      return setErrors({ confirmPassword: 'Passwords do not match' });
    if (!form.acceptTerms) return setErrors({ acceptTerms: 'Please accept the terms' });
    setBusy(true);
    try {
      await registerCompany(form);
      toast.success('Account created! Let’s set up your profile.');
      navigate('/company/setup', { replace: true });
    } catch (err) {
      if (err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create a Company account" subtitle="Start discovering creators today." side="company">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Company Name" required error={errors.companyName}>
          <input className="input" value={form.companyName} onChange={set('companyName')} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" required error={errors.email}>
            <input type="email" className="input" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <Field label="Industry / Category">
          <select className="input" value={form.industry} onChange={set('industry')}>
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City"><input className="input" value={form.city} onChange={set('city')} /></Field>
          <Field label="State"><input className="input" value={form.state} onChange={set('state')} /></Field>
          <Field label="Country"><input className="input" value={form.country} onChange={set('country')} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password}>
            <input type="password" className="input" value={form.password} onChange={set('password')} required />
          </Field>
          <Field label="Confirm Password" required error={errors.confirmPassword}>
            <input type="password" className="input" value={form.confirmPassword} onChange={set('confirmPassword')} required />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.acceptTerms} onChange={set('acceptTerms')} className="mt-0.5" />
          <span>
            I agree to the{' '}
            <Link to="/terms" className="text-brand-600">Terms</Link> &{' '}
            <Link to="/privacy" className="text-brand-600">Privacy Policy</Link>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-xs text-accent-600">{errors.acceptTerms}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600">Login</Link>
      </p>
    </AuthShell>
  );
}
