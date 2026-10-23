/** Deletion workflow with explicit boundaries so authorization/failure paths are testable. */
export interface DeletionServices {
  assertOrigin(request: Request): void;
  getUser(): Promise<{ id: string; email?: string } | null>;
  verifyPassword(email: string, password: string): Promise<{ userId: string | null; rateLimited?: boolean }>;
  deleteUser(userId: string): Promise<void>;
  clearSession(): Promise<void>;
}
const response = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});

export async function deleteOwnAccount(request: Request, services: DeletionServices) {
  try { services.assertOrigin(request); }
  catch { return response({ error: 'Please reopen CampusBridge and try again.' }, 403); }
  let body: { password: string; confirmation: string };
  try {
    const text = await request.text();
    if (text.length > 2048) throw new Error('Too large');
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some(k => k !== 'password' && k !== 'confirmation')
      || value.confirmation !== 'DELETE' || typeof value.password !== 'string'
      || value.password.length < 1 || value.password.length > 128) throw new Error('Invalid confirmation');
    body = value;
  } catch { return response({ error: 'Enter your current password and type DELETE to confirm.' }, 400); }
  try {
    const user = await services.getUser();
    if (!user?.email) return response({ error: 'Your session expired. Log in again before deleting your account.' }, 401);
    const check = await services.verifyPassword(user.email, body.password);
    if (check.rateLimited) return response({ error: 'Too many attempts. Wait a few minutes before trying again.' }, 429);
    if (check.userId !== user.id) return response({ error: 'Your password could not be confirmed. Check it and try again.' }, 403);
    await services.deleteUser(user.id);
    // Deletion is committed. Cleanup failure must never be reported as a failed deletion.
    try { await services.clearSession(); } catch { /* All further requests still validate the deleted user. */ }
    return response({ ok: true, redirect: '/login?deleted=success' });
  } catch {
    return response({ error: 'We couldn’t confirm deletion. Please try signing in again before retrying.' }, 503);
  }
}
