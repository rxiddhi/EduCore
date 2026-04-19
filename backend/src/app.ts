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

const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const allowedOrigins = [env.FRONTEND_ORIGIN, vercelOrigin].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests or those without Origin header
      if (!origin) return callback(null, true);
      
      // Allow known origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      // Allow Vercel deployment domains in production
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      // Log the rejected origin for debugging
      console.warn(`⚠️ CORS: Rejected origin: ${origin}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'educore-backend', timestamp: new Date().toISOString() });
});

// Support both /api/path and /path to accommodate different Vercel rewrite behaviors
const routeMap: Record<string, any> = {
  'auth': authRouter,
  'users': userRouter,
  'courses': courseRouter,
  'enrollments': enrollmentRouter,
  'grades': gradeRouter,
  'attendance': attendanceRouter,
  'analytics': analyticsRouter,
  'audit': auditRouter,
  'student': studentRouter,
  'teacher': teacherRouter
};

Object.entries(routeMap).forEach(([path, router]) => {
  app.use(`/api/${path}`, router);
  app.use(`/${path}`, router);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Always log the full error for debugging in Vercel
  console.error('❌ Server Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      issues: err.flatten()
    });
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  const status = (err as any).status || (err as any).statusCode || 500;
  
  return res.status(status).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});
