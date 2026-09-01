import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  canAccessPortalSite,
  getPortalSite,
  isPortalSiteId,
} from '@/lib/portal';

export const dynamic = 'force-dynamic';

const newsProfiles = {
  'everything-it': {
    query:
      '("managed service provider" OR MSP OR cybersecurity OR "Microsoft 365") (Ireland OR Europe OR global) when:7d',
    label: 'MSP, cybersecurity and Microsoft ecosystem',
    locale: { hl: 'en-IE', gl: 'IE', ceid: 'IE:en' },
  },
  'palo-verde': {
    query:
      '(oncology OR "cancer treatment" OR "cancer research" OR FDA) (Arizona OR global) when:7d',
    label: 'oncology, treatment and research',
    locale: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  },
  'az-web-corp': {
    query:
      '(SEO OR "Google Search" OR WordPress OR "AI marketing" OR "web development") (Arizona OR global) when:7d',
    label: 'SEO, web, WordPress and AI marketing',
    locale: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  },
} as const;

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const siteId = new URL(request.url).searchParams.get('siteId') ?? '';
  if (!isPortalSiteId(siteId) || !canAccessPortalSite(user, siteId))
    return Response.json(
      { error: 'Invalid client selection.' },
      { status: 400 },
    );
  const site = getPortalSite(siteId)!;
  const profile = newsProfiles[siteId];
  const feedUrl = new URL('https://news.google.com/rss/search');
  feedUrl.searchParams.set('q', profile.query);
  feedUrl.searchParams.set('hl', profile.locale.hl);
  feedUrl.searchParams.set('gl', profile.locale.gl);
  feedUrl.searchParams.set('ceid', profile.locale.ceid);

  try {
    const response = await fetch(feedUrl, {
      headers: { 'user-agent': 'AZWebCorp-Client-Portal/1.0' },
    });
    if (!response.ok) throw new Error(`NEWS_FEED_${response.status}`);
    const items = parseNewsFeed(await response.text()).slice(0, 10);
    return Response.json(
      {
        site: { id: site.id, name: site.name },
        topic: profile.label,
        updatedAt: new Date().toISOString(),
        items,
      },
      {
        headers: {
          'cache-control': 'private, max-age=300',
        },
      },
    );
  } catch {
    return Response.json({
      site: { id: site.id, name: site.name },
      topic: profile.label,
      updatedAt: new Date().toISOString(),
      items: [],
    });
  }
}

function parseNewsFeed(xml: string) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gu)]
    .map((match) => {
      const block = match[1] ?? '';
      const title = readTag(block, 'title');
      const rawLink = readTag(block, 'link');
      const source = readTag(block, 'source');
      const publishedAt = readTag(block, 'pubDate');
      let url = '';
      try {
        const parsed = new URL(rawLink);
        if (parsed.protocol === 'https:') url = parsed.toString();
      } catch {
        url = '';
      }
      return { title, url, source, publishedAt };
    })
    .filter((item) => item.title && item.url);
}

function readTag(block: string, tag: string) {
  const value = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'u'),
  )?.[1];
  return decodeXml((value ?? '').replace(/^<!\[CDATA\[|\]\]>$/gu, '').trim());
}

function decodeXml(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}
