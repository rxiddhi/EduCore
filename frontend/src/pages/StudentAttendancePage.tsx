import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface AttendanceSummary {
  student_id: string;
  present_count: number;
  total_count: number;
}

interface AttendanceRecent {
  id: string;
  class_date: string;
  status: 'PRESENT' | 'ABSENT';
  course_code: string;
  course_title: string;
}

export function StudentAttendancePage() {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [recent, setRecent] = useState<AttendanceRecent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        setError('');
        const [summaryPayload, recentPayload] = await Promise.all([
          apiFetch<AttendanceSummary>('/api/attendance/me'),
          apiFetch<AttendanceRecent[]>('/api/student/attendance/recent')
        ]);
        setSummary(summaryPayload);
        setRecent(recentPayload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    }

    void loadAttendance();
  }, []);

  const present = summary?.present_count ?? 0;
  const total = summary?.total_count ?? 0;
  const absent = Math.max(total - present, 0);
  const pct = total ? ((present / total) * 100).toFixed(1) : '0.0';

  return (
    <PortalLayout role="STUDENT" title="My Attendance">
      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <article className="ec-card p-8 md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Global Attendance</p>
          <p className="mt-2 text-5xl font-black tracking-tight text-[var(--primary)]">{loading ? '...' : `${pct}%`}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Present</p>
          <p className="mt-2 text-3xl font-black">{loading ? '...' : present}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Absences</p>
          <p className="mt-2 text-3xl font-black text-rose-700">{loading ? '...' : absent}</p>
        </article>
      </div>

      <article className="ec-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight">Recent Activity</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--surface-variant)] text-xs uppercase tracking-widest text-[var(--outline)]">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id} className="border-t border-[var(--surface-variant)]">
                <td className="px-4 py-3 font-medium">{new Date(row.class_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{row.course_code} - {row.course_title}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{row.status}</span>
                </td>
              </tr>
            ))}
            {!loading && !recent.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-3 text-sm text-[var(--on-surface-variant)]">No attendance records yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>

      <div className="mt-6">
        <Link to="/student/dashboard" className="rounded-lg bg-[var(--surface-high)] px-4 py-2 text-sm font-semibold text-[var(--on-primary-container)]">
          Back to Dashboard
        </Link>
      </div>
    </PortalLayout>
  );
}
