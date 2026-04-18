import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin, supabaseAnon } from '../config/supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  fullName: z.string().trim().min(2),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).default('STUDENT')
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const { data, error } = await supabaseAnon.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          full_name: body.fullName,
          role: body.role
        }
      }
    });

    if (error) return res.status(400).json({ message: error.message });
    if (!data.user) return res.status(400).json({ message: 'User creation failed' });

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      email: body.email,
      full_name: body.fullName,
      role: body.role
    });

    if (profileError) {
      return res.status(500).json({ message: 'Auth account created but profile sync failed: ' + profileError.message });
    }

    return res.status(201).json({ user: data.user, session: data.session });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const credentials = z
      .object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(6) })
      .parse(req.body);

    const { data, error } = await supabaseAnon.auth.signInWithPassword(credentials);

    if (error) return res.status(401).json({ message: error.message });

    return res.json(data);
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: body.refreshToken
    });

    if (error) return res.status(401).json({ message: error.message });
    return res.json(data);
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    await supabaseAnon.auth.signOut();
    return res.status(204).send();
  })
);
