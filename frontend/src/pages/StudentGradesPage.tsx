import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface GradeRow {
  id: string;
  student_id: string;
  course_id: string;
  grade_letter: string;
  grade_points: number;
  credits: number;
  created_at?: string;
}

export function StudentGradesPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadGrades() {
      try {
        setLoading(true);
        setError('');
        const payload = await apiFetch<GradeRow[]>('/api/grades/me');
        setGrades(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    }

    void loadGrades();
  }, []);

  const gpa = grades.length
    ? (grades.reduce((sum, row) => sum + Number(row.grade_points), 0) / grades.length).toFixed(2)
    : '0.00';
  const credits = grades.reduce((sum, row) => sum + row.credits, 0);

  return (
    <PortalLayout role="STUDENT" title="My Grades">
      <section className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Academic Performance</p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Live Gradebook</h2>
        </div>
      </section>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Current GPA</p>
          <p className="mt-3 text-5xl font-black tracking-tighter">{loading ? '...' : gpa}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Cumulative Credits</p>
          <p className="mt-3 text-5xl font-black tracking-tighter">{loading ? '...' : credits}</p>
        </article>
      </div>

      <div className="ec-card overflow-hidden">
        <div className="border-b border-[var(--surface-variant)] px-8 py-6">
          <h3 className="text-xl font-bold">Course Performance Breakdown</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-low)]">
            <tr>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Course ID</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Letter</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Points</th>
              <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Credits</th>
              <th className="px-8 py-4 text-right text-xs font-bold uppercase tracking-widest text-[var(--outline)]">Date</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((row) => (
              <tr key={row.id} className="border-t border-[var(--surface-variant)]">
                <td className="px-8 py-5 font-semibold">{row.course_id}</td>
                <td className="px-8 py-5">{row.grade_letter}</td>
                <td className="px-8 py-5 font-semibold">{Number(row.grade_points).toFixed(2)}</td>
                <td className="px-8 py-5">{row.credits}</td>
                <td className="px-8 py-5 text-right text-[var(--outline)]">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
            {!loading && !grades.length ? (
              <tr>
                <td colSpan={5} className="px-8 py-5 text-sm text-[var(--on-surface-variant)]">No grades available yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link to="/student/attendance" className="ec-primary-btn px-4 py-2 text-sm">
          View Attendance
        </Link>
      </div>
    </PortalLayout>
  );
}
