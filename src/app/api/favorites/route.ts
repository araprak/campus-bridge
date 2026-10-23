import { accountsEnabled, assertOrigin, identity, jsonBody, reply } from '@/lib/server';
import { normalizeFavoriteIds, parseFavoriteChange } from '@/domain/apartment-favorites';

export async function GET() {
  if (!accountsEnabled()) return reply({ error: 'Saved apartments are temporarily unavailable.' }, 503);
  try {
    const { client, user, loginVerified } = await identity();
    if (!user) return reply({ error: 'Log in to see your saved apartments.', redirect: '/login' }, 401);
    if (!loginVerified) return reply({ error: 'Your session expired. Please log in again.', redirect: '/login' }, 403);
    const result = await client.from('apartment_favorites').select('community_id').eq('user_id', user.id).order('created_at');
    if (result.error) return reply({ error: 'Your saved apartments could not be loaded. Please try again.' }, 503);
    return reply({ ids: normalizeFavoriteIds(result.data.map(row => row.community_id)) });
  } catch { return reply({ error: 'Your saved apartments could not be loaded. Please try again.' }, 503); }
}

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (!accountsEnabled()) return reply({ error: 'Saved apartments are temporarily unavailable.' }, 503);
    const { client, user, loginVerified } = await identity();
    if (!user) return reply({ error: 'Log in to save apartments.', redirect: '/login' }, 401);
    if (!loginVerified) return reply({ error: 'Your session expired. Please log in again.', redirect: '/login' }, 403);
    const change = parseFavoriteChange(await jsonBody(request));
    if (!change) return reply({ error: 'Choose a valid apartment and save action.' }, 400);
    // Ownership always comes from the authenticated server identity. Each change
    // affects one favorite, so separate devices do not overwrite entire lists.
    const result = change.saved
      ? await client.from('apartment_favorites').upsert({ user_id: user.id, community_id: change.communityId }, { onConflict: 'user_id,community_id', ignoreDuplicates: true })
      : await client.from('apartment_favorites').delete().eq('user_id', user.id).eq('community_id', change.communityId);
    if (result.error) return reply({ error: 'Your saved apartments were not changed. Please try again.' }, 503);
    return reply({ communityId: change.communityId, saved: change.saved });
  } catch { return reply({ error: 'Your saved apartments were not changed. Please reopen CampusBridge and try again.' }, 400); }
}
