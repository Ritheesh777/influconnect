import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from '../../components/AuthShell.jsx';
import { Spinner } from '../../components/ui.jsx';
import { authApi } from '../../api/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, refresh } = useAuth();
  const [state, setState] = useState(token ? 'verifying' : 'idle');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => {
        setState('done');
        refresh();
      })
      .catch(() => setState('error'));
  }, [token, refresh]);

  const resend = async () => {
    try {
      await authApi.resendVerification();
      setResent(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthShell title="Verify your email" subtitle="Confirm your email to unlock all features.">
      {state === 'verifying' && (
        <div className="flex items-center gap-3 text-slate-600">
          <Spinner /> Verifying your email…
        </div>
      )}
      {state === 'done' && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Your email is verified! You can now continue.
          <div className="mt-3">
            <Link to={user ? `/${user.role}` : '/login'} className="btn-primary">
              Continue
            </Link>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          This verification link is invalid or expired.
        </div>
      )}
      {state === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            We've sent a verification link to your email. Didn't get it?
          </p>
          {user ? (
            <button className="btn-primary" onClick={resend} disabled={resent}>
              {resent ? 'Sent!' : 'Resend verification email'}
            </button>
          ) : (
            <Link to="/login" className="btn-primary">
              Login to resend
            </Link>
          )}
        </div>
      )}
    </AuthShell>
  );
}
