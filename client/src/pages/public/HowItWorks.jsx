import { Link } from 'react-router-dom';
import { Reveal } from '../../lib/motion.jsx';
import { IconCompany, IconUser } from '../../components/icons.jsx';

const COMPANY = [
  ['Register', 'Create your company account and set up your brand profile.'],
  ['Post a Campaign', 'Describe the collaboration, requirements, follower range and deadline.'],
  ['Review Creators', 'See who applied, with their real metrics and portfolio.'],
  ['Chat', 'Negotiate privately in a dedicated real-time chat.'],
  ['Collaborate & Review', 'Work together, then leave a review to build trust.'],
];

const CREATOR = [
  ['Register', 'Create your creator account with your name and username.'],
  ['Add Socials', 'Link your platforms and showcase your reach and engagement.'],
  ['Browse', 'Filter campaigns by category, location, platform and follower range.'],
  ['Apply', 'Send an application with a message and your best work.'],
  ['Chat & Collaborate', 'Once you apply, chat unlocks so you can close the deal.'],
];

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <Reveal className="text-center">
        <h1 className="text-4xl font-bold text-ink-950">How InfluConnect Works</h1>
        <p className="mt-3 text-ink-500">
          Two sides, one transparent workflow. No payments handled on-platform — you settle privately.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Flow title="For Companies" Icon={IconCompany} tone="brand" steps={COMPANY} cta={['Register as Company', '/register/company']} />
        <Flow title="For Creators" Icon={IconUser} tone="accent" steps={CREATOR} cta={['Register as Creator', '/register/creator']} />
      </div>
    </div>
  );
}

function Flow({ title, Icon, tone, steps, cta }) {
  const dot = tone === 'brand' ? 'bg-brand-gradient' : 'bg-ink-950';
  return (
    <div className="card p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-ink-900">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${dot} text-white`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        {title}
      </h2>
      <ol className="mt-6 space-y-6">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${dot} text-sm font-bold text-white`}>
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{t}</h3>
              <p className="text-sm text-slate-500">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link to={cta[1]} className="btn-primary mt-8 w-full">
        {cta[0]}
      </Link>
    </div>
  );
}
