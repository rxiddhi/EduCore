import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.')
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid form');
      return;
    }

    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      navigate(user.role === 'TEACHER' || user.role === 'ADMIN' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--surface)] p-6">
      <div className="academic-mesh pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-indigo-600/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-[30vw] w-[30vw] rounded-full bg-emerald-600/5 blur-[100px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl md:grid-cols-2">
        <section className="hidden bg-[var(--surface-low)] p-12 md:flex md:flex-col md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--primary)]">EduCore</h1>
            <p className="mt-4 text-[var(--on-surface-variant)]">The artisan learning experience.</p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--on-surface-variant)]">
            Join a community of scholars and creators in a digital atelier designed for intellectual growth.
          </p>
        </section>

        <section className="p-8 md:p-12">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-[var(--on-surface-variant)]">Please enter your academic credentials to continue.</p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="ec-label block">Email Address</label>
              <div className="ec-icon-input-wrap">
                <span className="material-symbols-outlined ec-icon-input">alternate_email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  className="ec-input pl-12"
                  placeholder="scholar@educore.edu"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="ec-label block">Password</label>
              <div className="ec-icon-input-wrap">
                <span className="material-symbols-outlined ec-icon-input">lock</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  className="ec-input pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="ec-primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              {loading ? 'Signing in...' : 'Access Dashboard'}
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--on-surface-variant)]">
            New here?{' '}
            <Link to="/register" className="font-semibold text-[var(--primary)] hover:underline">
              Create account
            </Link>
          </p>

          <div className="mt-10 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-900">Demo Credentials</h3>
            <div className="mt-3 space-y-2 text-xs text-indigo-800/80">
              <p>
                <span className="font-semibold text-indigo-900">ADMIN:</span> admin@educore.demo / Demo@1234
              </p>
              <p>
                <span className="font-semibold text-indigo-900">TEACHER:</span> teacher@educore.demo / Demo@1234
              </p>
              <p>
                <span className="font-semibold text-indigo-900">STUDENT:</span> student1@educore.demo / Demo@1234
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setForm({ email: 'admin@educore.demo', password: 'Demo@1234' })}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                Use Admin
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'teacher@educore.demo', password: 'Demo@1234' })}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                Use Teacher
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'student1@educore.demo', password: 'Demo@1234' })}
                className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                Use Student
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
