import { getChatGPTUser } from '@/app/chatgpt-auth';
import { listAllGoogleProperties } from '@/lib/google';
import { getPortalAccess } from '@/lib/portal';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!getPortalAccess(user).isAgencyAdmin)
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    return Response.json(await listAllGoogleProperties(user.userId));
  } catch (error) {
    return Response.json({ error: friendlyError(error) }, { status: 502 });
  }
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('403'))
    return 'Google denied access. Confirm the Search Console, Analytics, and requested Business Profile APIs are enabled.';
  if (message.includes('GOOGLE_NOT_CONNECTED'))
    return 'Google is not connected yet.';
  return 'Google properties could not be loaded. Reconnect Google and try again.';
}
