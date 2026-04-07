import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { PortalLayout } from '../layouts/PortalLayout';

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
}

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        setError('');
        const payload = await apiFetch<Course[]>('/api/student/courses');
        setCourses(payload);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    void loadCourses();
  }, []);

  return (
    <PortalLayout role="STUDENT" title="My Courses">
      <section className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">Student Portal</p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">My Courses</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--on-surface-variant)]">Live enrolled courses from your account.</p>
        </div>
      </section>

      {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}

      <div className="grid gap-8 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="ec-card overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-indigo-600/20 to-emerald-500/10" />
            <div className="p-6">
              <h3 className="text-xl font-bold tracking-tight">{course.title}</h3>
              <p className="mt-1 text-sm text-[var(--on-surface-variant)]">{course.code} • {course.credits} credits</p>
            </div>
          </article>
        ))}
        {!loading && !courses.length ? (
          <article className="ec-card p-6 text-sm text-[var(--on-surface-variant)]">You are not enrolled in any course yet.</article>
        ) : null}
      </div>

      <div className="mt-6 flex gap-3">
        <Link to="/student/dashboard" className="rounded-lg bg-[var(--surface-high)] px-4 py-2 text-sm font-semibold text-[var(--on-primary-container)]">
          Back to Dashboard
        </Link>
        <Link to="/student/grades" className="ec-primary-btn px-4 py-2 text-sm">
          Go to Grades
        </Link>
      </div>
    </PortalLayout>
  );
}
