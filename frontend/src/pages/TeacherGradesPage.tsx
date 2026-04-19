import { useEffect, useState } from 'react';
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
    credits: number;
  };
  roster: RosterStudent[];
}

const gradeMap: Record<string, number> = {
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  C: 2.0,
  D: 1.0,
  F: 0
};

export function TeacherGradesPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [data, setData] = useState<RosterPayload | null>(null);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

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
        setGrades(
          Object.fromEntries(
            payload.roster.map((student) => [student.id, student.grade_letter ?? 'B'])
          )
        );
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

    try {
      setSaving(true);
      setSaved('');
      setError('');

      await Promise.all(
        data.roster.map((student) =>
          apiFetch('/api/grades', {
            method: 'POST',
            body: JSON.stringify({
              student_id: student.id,
              course_id: data.course.id,
              grade_letter: grades[student.id],
              grade_points: gradeMap[grades[student.id]] ?? 0,
              credits: data.course.credits
            })
          })
        )
      );

      setSaved('Grades saved successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  }

  if (!courseId) {
    return (
      <PortalLayout role="TEACHER" title="Grades">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-[var(--outline-soft)]">school</span>
          <h2 className="mb-2 text-2xl font-bold">Select a Course</h2>
          <p className="mb-6 text-[var(--on-surface-variant)]">Please select a course from your courses list to view and submit grades.</p>
          <Link to="/teacher/courses" className="ec-primary-btn inline-flex items-center gap-2">
            View My Courses
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout role="TEACHER" title="Grades">
      <section className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Submit Grades</h2>
          <p className="text-[var(--on-surface-variant)]">
            {loading ? 'Loading...' : data ? `${data.course.title} (${data.course.code})` : 'Course grading'}
          </p>
        </div>
        <Link to="/teacher/courses" className="rounded-lg bg-[var(--surface-high)] px-4 py-2 text-sm font-semibold text-indigo-900">
          Back to Courses
        </Link>
      </section>

      {error ? <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
      {saved ? <p className="mb-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{saved}</p> : null}

      <form onSubmit={onSave} className="ec-card p-5">
        <div className="grid gap-4">
          {(data?.roster ?? []).map((student) => (
            <div key={student.id} className="grid gap-3 rounded-lg border border-[var(--surface-variant)] p-3 md:grid-cols-[1fr_180px]">
              <div>
                <p className="font-semibold">{student.fullName}</p>
                <p className="text-sm text-[var(--on-surface-variant)]">{student.email}</p>
              </div>
              <select
                value={grades[student.id] ?? 'B'}
                onChange={(e) =>
                  setGrades((prev) => ({
                    ...prev,
                    [student.id]: e.target.value
                  }))
                }
                className="rounded-lg border border-[var(--surface-variant)] bg-white px-3 py-2"
              >
                {Object.keys(gradeMap).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button className="ec-primary-btn" type="submit" disabled={saving || loading || !data?.roster.length}>
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
        </div>
      </form>
    </PortalLayout>
  );
}
