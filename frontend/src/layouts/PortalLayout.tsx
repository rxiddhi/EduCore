import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';

interface PortalLayoutProps {
  role: Role;
  title: string;
  children: React.ReactNode;
}

const studentNav = [
  { to: '/student/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { to: '/student/courses', label: 'Courses', icon: 'menu_book' },
  { to: '/student/grades', label: 'Grades', icon: 'grade' },
  { to: '/student/attendance', label: 'Attendance', icon: 'event_available' }
];

const teacherNav = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/teacher/courses', label: 'Courses', icon: 'school' },
  { to: '/teacher/students', label: 'Students', icon: 'group' },
  { to: '/teacher/grades', label: 'Grades', icon: 'grade' },
  { to: '/teacher/settings', label: 'Settings', icon: 'settings' }
];

export function PortalLayout({ role, title, children }: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const nav = role === 'TEACHER' ? teacherNav : studentNav;
  const isTeacher = role === 'TEACHER';

  return (
    <div className="relative min-h-screen bg-[var(--surface)] text-[var(--on-surface)]">
      <div className="academic-mesh pointer-events-none absolute inset-0" />
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-[var(--surface-variant)] bg-white/95 p-4 backdrop-blur md:flex">
        <Link to={role === 'TEACHER' ? '/teacher/courses' : '/student/dashboard'} className="mb-6 block px-2 py-4">
          <p className="text-xl font-black tracking-tight text-[var(--primary)]">EduCore</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--outline)]">Academic Atelier</p>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition ${
                  isActive
                    ? 'bg-white text-[var(--primary)] shadow-sm'
                    : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        {isTeacher ? (
          <div className="space-y-3 border-t border-[var(--surface-variant)] pt-4">
            <Link
              to="/teacher/courses?new=1"
              className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-center text-sm font-bold text-white shadow-md shadow-indigo-200"
            >
              + New Course
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--surface-variant)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)]"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={logout}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--surface-variant)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--on-surface-variant)] hover:bg-[var(--surface-low)]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Logout
          </button>
        )}
      </aside>

      <div className="relative md:ml-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--surface-variant)] bg-white/85 px-6 backdrop-blur">
          {isTeacher ? (
            <div className="relative hidden w-full max-w-xl lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--outline)]">
                search
              </span>
              <input
                className="w-full rounded-full bg-[var(--surface-low)] py-2 pl-10 pr-4 text-sm text-[var(--on-surface)] outline-none"
                placeholder="Search curriculum or students..."
              />
            </div>
          ) : (
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          )}
          <div className="text-sm text-[var(--on-surface-variant)]">
            {isTeacher ? (
              <div className="flex items-center gap-4">
                <Link to="/teacher/settings?tab=notifications" className="text-[var(--on-surface-variant)]">
                  <span className="material-symbols-outlined">notifications</span>
                </Link>
                <Link to="/teacher/settings?tab=help" className="text-[var(--on-surface-variant)]">
                  <span className="material-symbols-outlined">help</span>
                </Link>
                <div className="h-8 w-px bg-[var(--surface-variant)]" />
                <span className="font-semibold">{user?.fullName}</span>
              </div>
            ) : (
              <>
                <span className="font-semibold">{user?.fullName}</span>
                <span className="ml-2 rounded bg-[var(--surface-low)] px-2 py-1 text-xs font-semibold">{user?.role}</span>
              </>
            )}
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
