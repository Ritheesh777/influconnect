import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import { FadeIn } from '../../lib/motion.jsx';
import { IconCompany, IconUser, IconArrowRight } from '../../components/icons.jsx';

export default function RegisterChoice() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh opacity-40" />
      <Logo />
      <FadeIn className="mt-8 text-center">
        <h1 className="text-3xl font-bold text-ink-950">Join Collably</h1>
        <p className="mt-2 text-ink-500">Choose how you want to get started.</p>
      </FadeIn>

      <div className="mt-10 grid w-full max-w-2xl gap-5 sm:grid-cols-2">
        <FadeIn delay={0.05}>
          <Choice to="/register/company" Icon={IconCompany} title="I'm a Company" text="Post campaigns and discover creators to promote your brand." tone="bg-brand-gradient" />
        </FadeIn>
        <FadeIn delay={0.12}>
          <Choice to="/register/creator" Icon={IconUser} title="I'm a Creator" text="Find sponsorship opportunities and grow your income." tone="bg-ink-950" />
        </FadeIn>
      </div>

      <p className="mt-8 text-sm text-ink-500">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600">Login</Link>
      </p>
    </div>
  );
}

function Choice({ to, Icon, title, text, tone }) {
  return (
    <Link to={to} className="card card-hover group h-full overflow-hidden">
      <div className={`relative ${tone} p-6 text-white`}>
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-25" />
        <Icon className="relative h-10 w-10" strokeWidth={1.6} />
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-ink-900">{title}</h2>
        <p className="mt-1 text-sm text-ink-500">{text}</p>
        <span className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
          Get started <IconArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
