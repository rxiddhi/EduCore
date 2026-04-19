import dotenv from 'dotenv';
import { z } from 'zod';

try {
  dotenv.config();
} catch (error) {
  // Ignore error if dotenv fails (common in serverless)
}

const envSchema = z.object({
  PORT: z.string().default('3000'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingKeys = error.errors.map((e) => e.path.join('.')).join(', ');
    console.error('❌ Missing or invalid environment variables:', missingKeys);
    // Provide a more descriptive error for Vercel logs
    throw new Error(`Missing or invalid environment variables: ${missingKeys}`);
  }
  throw error;
}

export { env };
