import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface StudentOverviewPayload {
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  stats: {
    gpa: number;
    courseCount: number;
    attendancePct: number;
    presentCount: number;
    absentCount: number;
    riskStatus: string;
    riskReasons: string[];
  };
  recentGrades: Array<{
    id: string;
    course_id: string;
    grade_letter: string;
    grade_points: number;
    credits: number;
    created_at?: string;
  }>;
}

export function StudentDashboardPage() {
  const [data, setData] = useState<StudentOverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true);
        setError('');
        const payload = await apiFetch<StudentOverviewPayload>('/api/student/overview');
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    void loadOverview();
  }, []);

  return (
    <PortalLayout role="STUDENT" title="Student Dashboard">
      <section className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight">Hello, {data?.student.fullName ?? 'Student'}!</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--on-surface-variant)]">
          Welcome back to your academic dashboard with live progress tracking.
        </p>
      </section>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <section className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Current GPA</p>
          <p className="mt-3 text-4xl font-black tracking-tight">{loading ? '...' : (data?.stats.gpa ?? 0).toFixed(2)}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Total Courses</p>
          <p className="mt-3 text-4xl font-black tracking-tight">{loading ? '...' : data?.stats.courseCount ?? 0}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Attendance Rate</p>
          <p className="mt-3 text-4xl font-black tracking-tight">{loading ? '...' : `${(data?.stats.attendancePct ?? 0).toFixed(1)}%`}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--outline)]">Risk Status</p>
          <p className="mt-3 text-2xl font-black tracking-tight">{loading ? '...' : data?.stats.riskStatus ?? 'Low'}</p>
          {data?.stats.riskReasons?.length ? (
            <p className="mt-1 text-xs text-rose-700">{data.stats.riskReasons.join(', ')}</p>
          ) : null}
        </article>
      </section>

      <section className="grid gap-8 lg:grid-cols-12">
        <article className="ec-card overflow-hidden lg:col-span-8">
          <div className="flex items-center justify-between border-b border-[var(--surface-variant)] px-6 py-4">
            <h3 className="text-xl font-bold tracking-tight">Recent Grades</h3>
            <Link to="/student/grades" className="text-sm font-semibold text-[var(--primary)] hover:underline">View All</Link>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[var(--surface-low)]">
              <tr className="text-xs uppercase tracking-wider text-[var(--outline)]">
                <th className="px-6 py-3">Course ID</th>
                <th className="px-6 py-3">Letter</th>
                <th className="px-6 py-3">Points</th>
                <th className="px-6 py-3">Credits</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(data?.recentGrades ?? []).slice(0, 6).map((grade) => (
                <tr key={grade.id} className="border-t border-[var(--surface-variant)]">
                  <td className="px-6 py-4 font-semibold">{grade.course_id}</td>
                  <td className="px-6 py-4 text-[var(--on-surface-variant)]">{grade.grade_letter}</td>
                  <td className="px-6 py-4 font-bold">{Number(grade.grade_points).toFixed(2)}</td>
                  <td className="px-6 py-4">{grade.credits}</td>
                </tr>
              ))}
              {!loading && !(data?.recentGrades.length ?? 0) ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm text-[var(--on-surface-variant)]">No grades yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>

        <aside className="space-y-4 lg:col-span-4">
          <article className="ec-card p-6">
            <h3 className="text-lg font-bold">Attendance Snapshot</h3>
            <div className="mt-3 space-y-2 text-sm">
              <p>Present: <span className="font-bold">{loading ? '...' : data?.stats.presentCount ?? 0}</span></p>
              <p>Absent: <span className="font-bold">{loading ? '...' : data?.stats.absentCount ?? 0}</span></p>
            </div>
          </article>
          <div className="flex flex-wrap gap-3">
            <Link to="/student/courses" className="ec-primary-btn px-4 py-2 text-sm">Courses</Link>
            <Link to="/student/attendance" className="rounded-lg bg-[var(--surface-high)] px-4 py-2 text-sm font-semibold text-[var(--on-primary-container)]">Attendance</Link>
          </div>
        </aside>
      </section>
    </PortalLayout>
  );
}
