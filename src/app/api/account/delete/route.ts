import { createClient } from '@supabase/supabase-js';
import { adminClient, assertOrigin, configured, reply, serverClient } from '@/lib/server';
import { clearLoginCookies, loginIdentity } from '@/lib/login-session';
import { deleteOwnAccount } from '@/lib/account-deletion';

export async function POST(request: Request) {
  // Deletion stays available independently of email sending and UTD verification.
  if (!configured() || !process.env.SUPABASE_SECRET_KEY) {
    return reply({ error: 'Account deletion is temporarily unavailable. Please try again shortly.' }, 503);
  }
  let client: Awaited<ReturnType<typeof serverClient>>;
  return deleteOwnAccount(request, {
    assertOrigin,
    getUser: async () => {
      client = await serverClient();
      const {user,loginVerified} = await loginIdentity(client);
      return loginVerified ? user : null;
    },
    verifyPassword: async (email, password) => {
      const check = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      try {
        const { data, error } = await check.auth.signInWithPassword({ email, password });
        return { userId: error ? null : data.user?.id ?? null, rateLimited: error?.status === 429 };
      } finally {
        // Password confirmation creates a temporary session; do not retain it or replace browser cookies.
        try { await check.auth.signOut({ scope: 'local' }); } catch { /* User deletion also removes its sessions. */ }
      }
    },
    deleteUser: async userId => {
      const { error } = await adminClient().auth.admin.deleteUser(userId, false);
      if (error) throw error;
    },
    clearSession: async () => {
      try { await client.auth.signOut({ scope: 'local' }); }
      finally {
        await clearLoginCookies(true);
      }
    },
  });
}
