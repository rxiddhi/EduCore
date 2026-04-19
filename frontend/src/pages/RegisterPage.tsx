import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';

const schema = z
  .object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be 6+ chars'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'TEACHER'])
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as Exclude<Role, 'ADMIN'>
  });
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
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role
      });
      navigate('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--surface)] p-6">
      <div className="academic-mesh pointer-events-none absolute inset-0" />
      <div className="relative mx-auto w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
        <h1 className="text-3xl font-black tracking-tight text-[var(--primary)]">Create Account</h1>
        <p className="mt-2 text-sm text-[var(--on-surface-variant)]">Choose a role and complete your registration.</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div className="flex gap-3 rounded-lg bg-[var(--surface-low)] p-1">
            {(['STUDENT', 'TEACHER'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((s) => ({ ...s, role }))}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
                  form.role === role ? 'bg-white text-[var(--primary)] shadow-sm' : 'text-[var(--on-surface-variant)]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <input className="ec-input" placeholder="Full Name" value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} />
          <input className="ec-input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <input className="ec-input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          <input className="ec-input" placeholder="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))} />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <button type="submit" disabled={loading} className="ec-primary-btn flex w-full items-center justify-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-[var(--on-surface-variant)]">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
