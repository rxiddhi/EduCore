import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { StudentAttendancePage } from './pages/StudentAttendancePage';
import { StudentCoursesPage } from './pages/StudentCoursesPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { StudentGradesPage } from './pages/StudentGradesPage';
import { TeacherAttendancePage } from './pages/TeacherAttendancePage';
import { TeacherCalendarPage } from './pages/TeacherCalendarPage';
import { TeacherCoursesPage } from './pages/TeacherCoursesPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { TeacherGradesPage } from './pages/TeacherGradesPage';
import { TeacherSettingsPage } from './pages/TeacherSettingsPage';
import { TeacherStudentsPage } from './pages/TeacherStudentsPage';
import type { Role } from './types/auth';

function roleHome(role: Role) {
  if (role === 'TEACHER' || role === 'ADMIN') return '/teacher/dashboard';
  return '/student/dashboard';
}

function ProtectedRoute({ allow, children }: { allow: Role[]; children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;

  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (user) return <Navigate to={roleHome(user.role)} replace />;

  return children;
}

function RootRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={roleHome(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allow={['STUDENT']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute allow={['STUDENT']}>
            <StudentCoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/grades"
        element={
          <ProtectedRoute allow={['STUDENT']}>
            <StudentGradesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allow={['STUDENT']}>
            <StudentAttendancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherCoursesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherGradesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/settings"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/calendar"
        element={
          <ProtectedRoute allow={['TEACHER', 'ADMIN']}>
            <TeacherCalendarPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
