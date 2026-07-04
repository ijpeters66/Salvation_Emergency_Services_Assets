import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export type EnvStatus = {
  configured: boolean;
  missing: string[];
};

export function getPublicEnvStatus(env: NodeJS.ProcessEnv = process.env): EnvStatus {
  const result = publicEnvSchema.safeParse(env);

  if (result.success) {
    return {
      configured: true,
      missing: [],
    };
  }

  return {
    configured: false,
    missing: result.error.issues.map((issue) => String(issue.path[0])),
  };
}

export function getPublicEnv(env: NodeJS.ProcessEnv = process.env): PublicEnv {
  return publicEnvSchema.parse(env);
}

export function getSupabaseProjectRef(env: NodeJS.ProcessEnv = process.env) {
  const result = publicEnvSchema.safeParse(env);

  if (!result.success) {
    return null;
  }

  try {
    return new URL(result.data.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}
