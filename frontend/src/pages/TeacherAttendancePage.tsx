import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface RosterStudent {
  id: string;
  fullName: string;
  email: string;
}

interface RosterPayload {
  course: {
    id: string;
    code: string;
    title: string;
  };
  roster: RosterStudent[];
}

export function TeacherAttendancePage() {
  const [searchParams] = useSearchParams();
  const [statusByStudent, setStatusByStudent] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [data, setData] = useState<RosterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const courseId = searchParams.get('courseId');

  useEffect(() => {
    async function loadRoster() {
      if (!courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const payload = await apiFetch<RosterPayload>(`/api/teacher/courses/${courseId}/roster`);
        setData(payload);
        setStatusByStudent(Object.fromEntries(payload.roster.map((student) => [student.id, 'PRESENT'])));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load roster');
      } finally {
        setLoading(false);
      }
    }

    void loadRoster();
  }, [courseId]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!data) return;

    const classDate = new Date().toISOString().slice(0, 10);

    try {
      setSaving(true);
      setSaved('');
      setError('');

      await apiFetch(`/api/teacher/courses/${data.course.id}/attendance`, {
        method: 'POST',
        body: JSON.stringify({
          class_date: classDate,
          records: data.roster.map((student) => ({
            student_id: student.id,
            status: statusByStudent[student.id] ?? 'PRESENT'
          }))
        })
      });

      setSaved('Attendance saved successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  if (!courseId) {
    return (
      <PortalLayout role="TEACHER" title="Record Attendance">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-[var(--outline-soft)]">event_available</span>
          <h2 className="mb-2 text-2xl font-bold">Select a Course</h2>
          <p className="mb-6 text-[var(--on-surface-variant)]">Please select a course from your courses list to record attendance.</p>
          <Link to="/teacher/courses" className="ec-primary-btn inline-flex items-center gap-2">
            View My Courses
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout role="TEACHER" title="Record Attendance">
      <section className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{loading ? 'Loading...' : data?.course.title ?? 'Record Attendance'}</h2>
          <p className="text-[var(--on-surface-variant)]">
            {data?.course.code ? `${data.course.code} • ${new Date().toLocaleDateString()}` : 'Attendance session'}
          </p>
        </div>
        <Link to="/teacher/courses" className="rounded-lg bg-[var(--surface-high)] px-4 py-2 text-sm font-semibold text-indigo-900">
          Back to Courses
        </Link>
      </section>

      {error ? <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
      {saved ? <p className="mb-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{saved}</p> : null}

      <form className="ec-card overflow-hidden" onSubmit={onSave}>
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-low)]">
            <tr>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.roster ?? []).map((student) => (
              <tr key={student.id} className="border-t border-[var(--surface-variant)]">
                <td className="px-4 py-3 font-semibold">{student.fullName}</td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={statusByStudent[student.id] ?? 'PRESENT'}
                    onChange={(e) =>
                      setStatusByStudent((prev) => ({
                        ...prev,
                        [student.id]: e.target.value as 'PRESENT' | 'ABSENT'
                      }))
                    }
                    className="rounded border border-[var(--surface-variant)] bg-white px-2 py-1"
                  >
                    <option>PRESENT</option>
                    <option>ABSENT</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-3 border-t border-[var(--surface-variant)] p-4">
          <button className="ec-primary-btn" type="submit" disabled={saving || loading || !data?.roster.length}>
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </form>
    </PortalLayout>
  );
}
