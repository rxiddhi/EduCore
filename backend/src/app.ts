import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { analyticsRouter } from './routes/analytics.js';
import { attendanceRouter } from './routes/attendance.js';
import { auditRouter } from './routes/audit.js';
import { authRouter } from './routes/auth.js';
import { courseRouter } from './routes/courses.js';
import { enrollmentRouter } from './routes/enrollments.js';
import { gradeRouter } from './routes/grades.js';
import { studentRouter } from './routes/student.js';
import { teacherRouter } from './routes/teacher.js';
import { userRouter } from './routes/users.js';

export const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'educore-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/grades', gradeRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.flatten()
    });
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  return res.status(500).json({ message });
});
