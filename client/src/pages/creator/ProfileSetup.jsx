import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { creatorApi } from '../../api/endpoints.js';
import { Field } from '../../components/ui.jsx';
import SocialsEditor from '../../components/SocialsEditor.jsx';
import Logo from '../../components/Logo.jsx';
import { IconCheck } from '../../components/icons.jsx';

export default function CreatorProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    creatorApi.me().then(({ profile }) => setForm(profile)).catch(() => setForm({}));
  }, []);

  if (!form) return null;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const saveBasics = async () => {
    setBusy(true);
    try {
      await creatorApi.update({ fullName: form.fullName, bio: form.bio, city: form.city, state: form.state, country: form.country });
      if (avatar) {
        const fd = new FormData();
        fd.append('avatar', avatar);
        await creatorApi.updateAvatar(fd);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveSocials = async (socials) => {
    try {
      await creatorApi.updateSocials(socials);
      toast.success('Profile ready! Welcome aboard.');
      navigate('/creator', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Logo />
        <div className="mt-6 flex items-center gap-2 text-sm">
          <Dot active={step >= 1} label="Basics" />
          <div className="h-px flex-1 bg-slate-200" />
          <Dot active={step >= 2} label="Socials" />
        </div>

        {step === 1 ? (
          <div className="card mt-6 space-y-5 p-6">
            <h1 className="text-xl font-bold text-slate-900">Tell us about you</h1>
            <Field label="Profile Picture">
              <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} className="text-sm" />
            </Field>
            <Field label="Full Name"><input className="input" value={form.fullName || ''} onChange={set('fullName')} /></Field>
            <Field label="Bio" hint="A short description of your content & niche">
              <textarea className="input min-h-[90px]" value={form.bio || ''} onChange={set('bio')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City"><input className="input" value={form.city || ''} onChange={set('city')} /></Field>
              <Field label="State"><input className="input" value={form.state || ''} onChange={set('state')} /></Field>
              <Field label="Country"><input className="input" value={form.country || ''} onChange={set('country')} /></Field>
            </div>
            <div className="flex justify-end">
              <button className="btn-primary" onClick={saveBasics} disabled={busy}>{busy ? 'Saving…' : 'Continue →'}</button>
            </div>
          </div>
        ) : (
          <div className="card mt-6 p-6">
            <h1 className="text-xl font-bold text-slate-900">Add your social accounts</h1>
            <p className="mt-1 text-sm text-slate-500">Show brands your reach. You can edit these anytime.</p>
            <div className="mt-5">
              <SocialsEditor initial={form.socials} onSave={saveSocials} />
            </div>
            <button className="btn-ghost mt-3" onClick={() => navigate('/creator')}>Skip for now</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Dot({ active, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid h-6 w-6 place-items-center rounded-full ${active ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-500'}`}>
        {active && <IconCheck className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className={active ? 'font-medium text-ink-700' : 'text-ink-400'}>{label}</span>
    </div>
  );
}
