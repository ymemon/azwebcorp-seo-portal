import { getChatGPTUser } from '@/app/chatgpt-auth';
import { canAccessPortalSite, isPortalSiteId } from '@/lib/portal';
import { loadDashboardData } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId') ?? 'northstar-msp';
  const requestedRange = url.searchParams.get('range') ?? '28d';
  if (
    !isPortalSiteId(siteId) ||
    !canAccessPortalSite(user, siteId) ||
    !['7d', '28d', '90d'].includes(requestedRange)
  ) {
    return Response.json(
      { error: 'Invalid dashboard selection.' },
      { status: 400 },
    );
  }
  try {
    return Response.json(
      await loadDashboardData(
        user.userId,
        siteId,
        requestedRange as '7d' | '28d' | '90d',
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'SITE_NOT_MAPPED')
      return Response.json(
        {
          error: 'Connect this client to Search Console and Analytics first.',
          code: 'SITE_NOT_MAPPED',
        },
        { status: 409 },
      );
    if (message.includes('GOOGLE_NOT_CONNECTED'))
      return Response.json(
        {
          error: 'Connect Google before loading live data.',
          code: 'GOOGLE_NOT_CONNECTED',
        },
        { status: 409 },
      );
    if (message.includes('403'))
      return Response.json(
        {
          error:
            'Google denied one of the required API requests. Confirm the APIs are enabled and the selected properties are accessible.',
          code: 'GOOGLE_FORBIDDEN',
        },
        { status: 502 },
      );
    return Response.json(
      {
        error:
          'Live reporting could not be loaded. Try again or review the Google connection.',
        code: 'REPORTING_FAILED',
      },
      { status: 502 },
    );
  }
}
