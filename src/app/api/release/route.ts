import releases from '@/data/releases.json';
export const dynamic='force-dynamic';
export function GET(){return Response.json({version:releases[0].version},{headers:{'Cache-Control':'no-store'}});}
