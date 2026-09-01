import { getChatGPTUser } from '@/app/chatgpt-auth';
import { loadBusinessProfileData } from '@/lib/business-profile';
import { canAccessPortalSite, isPortalSiteId } from '@/lib/portal';

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
    return Response.json(await loadBusinessProfileData(user.userId, siteId));
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('GBP_NOT_MAPPED'))
      return Response.json(
        {
          error: 'Choose this client’s Google Business Profile listing first.',
          code: 'GBP_NOT_MAPPED',
        },
        { status: 409 },
      );
    if (message.includes('403'))
      return Response.json(
        {
          error:
            'Google Business Profile API access is not enabled or approved for this Cloud project.',
          code: 'GBP_API_UNAVAILABLE',
        },
        { status: 502 },
      );
    return Response.json(
      {
        error: 'Google Business Profile data could not be loaded.',
        code: 'GBP_FAILED',
      },
      { status: 502 },
    );
  }
}
