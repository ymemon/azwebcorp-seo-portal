import { getChatGPTUser } from '@/app/chatgpt-auth';
import { canAccessPortalSite, isPortalSiteId } from '@/lib/portal';
import { loadLiveData } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const siteId = new URL(request.url).searchParams.get('siteId') ?? '';
  if (!isPortalSiteId(siteId) || !canAccessPortalSite(user, siteId))
    return Response.json(
      { error: 'Invalid client selection.' },
      { status: 400 },
    );

  try {
    return Response.json(await loadLiveData(user.userId, siteId));
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('SITE_NOT_MAPPED'))
      return Response.json(
        {
          error: 'Connect this client to Google Analytics first.',
          code: 'SITE_NOT_MAPPED',
        },
        { status: 409 },
      );
    if (message.includes('GOOGLE_NOT_CONNECTED'))
      return Response.json(
        {
          error: 'Connect Google before loading realtime data.',
          code: 'GOOGLE_NOT_CONNECTED',
        },
        { status: 409 },
      );
    return Response.json(
      {
        error: 'Realtime Analytics is temporarily unavailable.',
        code: 'REALTIME_FAILED',
      },
      { status: 502 },
    );
  }
}
