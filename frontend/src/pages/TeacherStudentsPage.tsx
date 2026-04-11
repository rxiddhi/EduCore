import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface RosterStudent {
  id: string;
  fullName: string;
  email: string;
  grade_letter: string | null;
  grade_points: number | null;
}

interface RosterPayload {
  course: {
    id: string;
    code: string;
    title: string;
  };
  roster: RosterStudent[];
}

export function TeacherStudentsPage() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<RosterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const courseId = searchParams.get('courseId');

  useEffect(() => {
    async function loadRoster() {
      if (!courseId) {
        setError('Missing courseId in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const payload = await apiFetch<RosterPayload>(`/api/teacher/courses/${courseId}/roster`);
        setData(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load roster');
      } finally {
        setLoading(false);
      }
    }

    void loadRoster();
  }, [courseId]);

  const filtered = useMemo(() => {
    const roster = data?.roster ?? [];
    if (!query.trim()) return roster;
    const q = query.toLowerCase();
    return roster.filter((student) => student.fullName.toLowerCase().includes(q) || student.email.toLowerCase().includes(q));
  }, [data?.roster, query]);

  return (
    <PortalLayout role="TEACHER" title="Students">
      <section className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{loading ? 'Loading...' : data?.course.title ?? 'Roster'}</h2>
          <p className="text-[var(--on-surface-variant)]">{data?.course.code ? `Roster for ${data.course.code}` : 'Course roster'}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-lg border border-[var(--surface-variant)] bg-white px-3 py-2 text-sm"
            placeholder="Search students"
          />
          <Link to="/teacher/courses" className="rounded-lg bg-[var(--surface-high)] px-4 py-2 text-sm font-semibold text-indigo-900">
            Back to Courses
          </Link>
        </div>
      </section>

      {error ? <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="ec-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-low)]">
            <tr>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Current Grade</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-t border-[var(--surface-variant)]">
                <td className="px-4 py-3 font-semibold">{student.fullName}</td>
                <td className="px-4 py-3 text-[var(--on-surface-variant)]">{student.email}</td>
                <td className="px-4 py-3">{student.grade_letter ? `${student.grade_letter} (${student.grade_points?.toFixed(2)})` : 'Not graded'}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`mailto:${student.email}`}
                    className="rounded-md bg-[var(--surface-high)] px-3 py-1.5 text-xs font-semibold text-indigo-900"
                  >
                    Message
                  </a>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length ? (
              <tr>
                <td className="px-4 py-6 text-sm text-[var(--on-surface-variant)]" colSpan={4}>
                  No students found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PortalLayout>
  );
}
