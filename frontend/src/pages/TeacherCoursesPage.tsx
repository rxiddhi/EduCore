import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface TeacherCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  teacher_id: string | null;
  students: number;
  average_grade_points: number | null;
  average_grade_label: string;
  pending_tasks: number;
}

interface TeacherDashboardPayload {
  teacher: {
    id: string;
    fullName: string;
    email: string;
  };
  stats: {
    totalCourses: number;
    totalStudents: number;
    averageGradePoints: number;
  };
  courses: TeacherCourse[];
}

function exportCoursesCsv(courses: TeacherCourse[]) {
  const headers = ['code', 'title', 'credits', 'students', 'average_grade_points', 'pending_tasks'];
  const rows = courses.map((course) => [
    course.code,
    course.title,
    String(course.credits),
    String(course.students),
    course.average_grade_points == null ? '' : String(course.average_grade_points),
    String(course.pending_tasks)
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.map((v) => `"${v.replaceAll('"', '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'teacher-courses-export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function TeacherCoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<TeacherDashboardPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const showNewModal = searchParams.get('new') === '1';

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const payload = await apiFetch<TeacherDashboardPayload>('/api/teacher/dashboard');
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load teacher dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const filteredCourses = useMemo(() => {
    const courses = data?.courses ?? [];
    if (!query.trim()) return courses;
    const q = query.toLowerCase();
    return courses.filter((course) => course.title.toLowerCase().includes(q) || course.code.toLowerCase().includes(q));
  }, [data?.courses, query]);

  function closeModal() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('new');
      return next;
    });
  }

  async function createCourse(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim();
    const code = String(formData.get('code') ?? '').trim().toUpperCase();
    const credits = Number(formData.get('credits') ?? 3);

    if (!title || !code || !Number.isFinite(credits)) return;

    try {
      setCreating(true);
      await apiFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify({ title, code, credits })
      });
      closeModal();
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create course');
    } finally {
      setCreating(false);
    }
  }

  return (
    <PortalLayout role="TEACHER" title="Assigned Courses">
      <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-700">Academic Cycle 2024</p>
          <h2 className="mt-2 text-5xl font-black tracking-tight text-slate-900">Assigned Courses</h2>
          <p className="mt-3 max-w-2xl text-[var(--on-surface-variant)]">
            Manage active lecture series, student performance, grades, and attendance in one place.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter modules..."
            className="rounded-xl border border-[var(--surface-variant)] bg-white px-4 py-3 text-sm"
          />
          <button
            onClick={() => exportCoursesCsv(filteredCourses)}
            disabled={!filteredCourses.length}
            className="rounded-xl bg-[var(--surface-high)] px-6 py-3 text-sm font-semibold text-indigo-900 disabled:opacity-50"
          >
            <span className="material-symbols-outlined mr-2 align-[-4px] text-[20px]">ios_share</span>
            Export Records
          </button>
          <button onClick={() => void loadDashboard()} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-900">
            Refresh
          </button>
        </div>
      </section>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <section className="mb-10 grid gap-4 md:grid-cols-4">
        <article className="ec-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--outline)]">Total Courses</p>
          <p className="mt-2 text-5xl font-black tracking-tight">{loading ? '...' : data?.stats.totalCourses ?? 0}</p>
        </article>
        <article className="ec-card p-6">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--outline)]">Total Students</p>
          <p className="mt-2 text-5xl font-black tracking-tight">{loading ? '...' : data?.stats.totalStudents ?? 0}</p>
        </article>
        <article className="ec-card p-6 md:col-span-2">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--outline)]">Average Grade Points</p>
          <p className="mt-2 text-5xl font-black tracking-tight">{loading ? '...' : (data?.stats.averageGradePoints ?? 0).toFixed(2)} / 4.00</p>
          <div className="mt-5 h-2.5 w-full rounded-full bg-emerald-100">
            <div
              className="h-2.5 rounded-full bg-emerald-700"
              style={{ width: `${Math.min(((data?.stats.averageGradePoints ?? 0) / 4) * 100, 100)}%` }}
            />
          </div>
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h3 className="text-2xl font-black tracking-tight">Active Modules</h3>
          <div className="h-px flex-1 bg-[var(--surface-variant)]" />
        </div>

        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <article key={course.id} className="ec-card border-l-4 border-l-indigo-500 p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-indigo-700">
                      {course.code}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      {course.credits} CREDITS
                    </span>
                  </div>
                  <h4 className="text-4xl font-black tracking-tight text-slate-900">{course.title}</h4>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--outline)]">Enrollment</p>
                      <p className="mt-1 text-lg font-bold">{course.students} Students</p>
                    </div>
                    <div className="sm:border-l sm:border-[var(--surface-variant)] sm:pl-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--outline)]">Average Grade</p>
                      <p className="mt-1 text-lg font-bold text-emerald-700">{course.average_grade_label}</p>
                    </div>
                    <div className="sm:border-l sm:border-[var(--surface-variant)] sm:pl-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--outline)]">Pending Grading</p>
                      <p className="mt-1 text-lg font-bold text-rose-700">{course.pending_tasks} Students</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 xl:w-56">
                  <Link
                    to={`/teacher/attendance?courseId=${course.id}`}
                    className="rounded-xl bg-[var(--surface-high)] px-4 py-3 text-center text-sm font-semibold text-indigo-900"
                  >
                    Record Attendance
                  </Link>
                  <Link
                    to={`/teacher/grades?courseId=${course.id}`}
                    className="rounded-xl bg-[var(--surface-high)] px-4 py-3 text-center text-sm font-semibold text-indigo-900"
                  >
                    Submit Grades
                  </Link>
                  <Link
                    to={`/teacher/students?courseId=${course.id}`}
                    className="rounded-xl bg-[var(--surface-high)] px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    View Roster
                  </Link>
                </div>
              </div>
            </article>
          ))}
          {!loading && !filteredCourses.length ? (
            <article className="ec-card p-6 text-sm text-[var(--on-surface-variant)]">No courses found.</article>
          ) : null}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--surface-variant)] bg-white p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-xl font-bold">End-of-Term Grade Submission</h4>
            <p className="text-[var(--on-surface-variant)]">
              Final submissions for the semester close soon. Ensure attendance and grades are updated.
            </p>
          </div>
          <Link to="/teacher/calendar" className="text-sm font-bold uppercase tracking-[0.12em] text-indigo-700">
            View Academic Calendar
          </Link>
        </div>
      </section>

      {showNewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Create New Course</h3>
              <button onClick={closeModal} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void createCourse(new FormData(event.currentTarget));
              }}
              className="space-y-3"
            >
              <input name="title" className="ec-input" placeholder="Course Title" required />
              <input name="code" className="ec-input" placeholder="Course Code" required />
              <input name="credits" type="number" min={1} max={6} defaultValue={3} className="ec-input" placeholder="Credits" required />
              <button className="ec-primary-btn w-full" type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </PortalLayout>
  );
}
