import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { companyApi } from '../../api/endpoints.js';
import { Field } from '../../components/ui.jsx';
import Logo from '../../components/Logo.jsx';

export default function CompanyProfileSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    companyApi.me().then(({ profile }) => setForm(profile)).catch(() => setForm({}));
  }, []);

  if (!form) return null;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setBusy(true);
    try {
      await companyApi.update(form);
      if (logo) {
        const fd = new FormData();
        fd.append('logo', logo);
        await companyApi.updateMedia(fd);
      }
      toast.success('Profile ready! Welcome aboard.');
      navigate('/company', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Logo />
        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-900">Set up your company profile</h1>
          <p className="mt-1 text-slate-500">This helps creators trust and understand your brand.</p>
        </div>

        <div className="card mt-6 space-y-5 p-6">
          <Field label="Logo">
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} className="text-sm" />
          </Field>
          <Field label="Company Description" hint="Tell creators who you are and what you're about.">
            <textarea className="input min-h-[110px]" value={form.description || ''} onChange={set('description')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website"><input className="input" value={form.website || ''} onChange={set('website')} placeholder="https://" /></Field>
            <Field label="Address"><input className="input" value={form.address || ''} onChange={set('address')} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City"><input className="input" value={form.city || ''} onChange={set('city')} /></Field>
            <Field label="State"><input className="input" value={form.state || ''} onChange={set('state')} /></Field>
            <Field label="Country"><input className="input" value={form.country || ''} onChange={set('country')} /></Field>
          </div>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => navigate('/company')}>Skip for now</button>
            <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save & Continue'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
