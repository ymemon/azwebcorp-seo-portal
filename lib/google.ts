import { env } from 'cloudflare:workers';

import { PORTAL_TENANT_ID } from '@/lib/portal';

const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/business.manage',
];

export type GoogleConnectionRow = {
  id: string;
  google_email: string;
  refresh_ciphertext: string | null;
  refresh_nonce: string | null;
  scopes_json: string;
  connected_at: string;
};

export type GoogleProperty = {
  id: string;
  name: string;
  note: string;
};

export type GooglePropertyWithAccount = GoogleProperty & {
  connectionId: string;
  googleEmail: string;
};

export function googleConfiguration() {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = env.GOOGLE_REDIRECT_URI?.trim();
  const encryptionKey = env.TOKEN_ENCRYPTION_KEY?.trim();
  return {
    ready: Boolean(clientId && clientSecret && redirectUri && encryptionKey),
    clientId,
    clientSecret,
    redirectUri,
    encryptionKey,
  };
}

export function googleAuthorizationUrl(state: string, codeChallenge: string) {
  const config = googleConfiguration();
  if (!config.ready) throw new Error('GOOGLE_CONFIGURATION_REQUIRED');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.clientId!);
  url.searchParams.set('redirect_uri', config.redirectUri!);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export function randomBase64Url(bytes = 32) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64Url(values);
}

export async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

export async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string,
) {
  const config = googleConfiguration();
  if (!config.ready) throw new Error('GOOGLE_CONFIGURATION_REQUIRED');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      redirect_uri: config.redirectUri!,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== 'string') {
    throw new Error(
      `GOOGLE_TOKEN_EXCHANGE_FAILED:${errorDetail(payload.error, response.status)}`,
    );
  }
  return payload as {
    access_token: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };
}

export async function fetchGoogleIdentity(accessToken: string) {
  const response = await fetch(
    'https://openidconnect.googleapis.com/v1/userinfo',
    {
      headers: { authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok)
    throw new Error(`GOOGLE_USERINFO_FAILED:${response.status}`);
  return (await response.json()) as { sub: string; email: string };
}

export async function encryptRefreshToken(refreshToken: string) {
  const key = await encryptionKey();
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    new TextEncoder().encode(refreshToken),
  );
  return {
    ciphertext: toBase64Url(new Uint8Array(ciphertext)),
    nonce: toBase64Url(nonce),
  };
}

export async function getGoogleConnection(userId: string) {
  return (await env.DB.prepare(
    `SELECT id, google_email, refresh_ciphertext, refresh_nonce, scopes_json, connected_at
     FROM google_connections
     WHERE tenant_id = ? AND status = 'active'
     ORDER BY CASE WHEN connected_by = ? THEN 0 ELSE 1 END, connected_at DESC
     LIMIT 1`,
  )
    .bind(PORTAL_TENANT_ID, userId)
    .first()) as GoogleConnectionRow | null;
}

export async function listGoogleConnections(userId: string) {
  const result = await env.DB.prepare(
    `SELECT id, google_email, refresh_ciphertext, refresh_nonce, scopes_json, connected_at
     FROM google_connections
     WHERE tenant_id = ? AND status = 'active'
     ORDER BY CASE WHEN connected_by = ? THEN 0 ELSE 1 END, connected_at DESC`,
  )
    .bind(PORTAL_TENANT_ID, userId)
    .all<GoogleConnectionRow>();
  return result.results;
}

export async function getGoogleConnectionById(connectionId: string) {
  return (await env.DB.prepare(
    `SELECT id, google_email, refresh_ciphertext, refresh_nonce, scopes_json, connected_at
     FROM google_connections
     WHERE tenant_id = ? AND id = ? AND status = 'active'
     LIMIT 1`,
  )
    .bind(PORTAL_TENANT_ID, connectionId)
    .first()) as GoogleConnectionRow | null;
}

export async function getGoogleAccessToken(userId: string) {
  const connection = await getGoogleConnection(userId);
  return refreshGoogleAccessToken(connection);
}

export async function getGoogleAccessTokenForConnection(connectionId: string) {
  const connection = await getGoogleConnectionById(connectionId);
  return refreshGoogleAccessToken(connection);
}

async function refreshGoogleAccessToken(
  connection: GoogleConnectionRow | null,
) {
  if (!connection?.refresh_ciphertext || !connection.refresh_nonce) {
    throw new Error('GOOGLE_NOT_CONNECTED');
  }
  const refreshToken = await decryptRefreshToken(
    connection.refresh_ciphertext,
    connection.refresh_nonce,
  );
  const config = googleConfiguration();
  if (!config.ready) throw new Error('GOOGLE_CONFIGURATION_REQUIRED');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== 'string') {
    await env.DB.prepare(
      `UPDATE google_connections SET status = 'expired' WHERE id = ?`,
    )
      .bind(connection.id)
      .run();
    throw new Error(
      `GOOGLE_REFRESH_FAILED:${errorDetail(payload.error, response.status)}`,
    );
  }
  return { accessToken: payload.access_token as string, connection };
}

export async function listAllGoogleProperties(userId: string) {
  const connections = await listGoogleConnections(userId);
  if (connections.length === 0) throw new Error('GOOGLE_NOT_CONNECTED');
  const results = await Promise.allSettled(
    connections.map(async (connection) => {
      const { accessToken } = await getGoogleAccessTokenForConnection(
        connection.id,
      );
      return listGoogleProperties(accessToken);
    }),
  );
  const accounts = connections.map((connection, index) => ({
    id: connection.id,
    email: connection.google_email,
    connectedAt: connection.connected_at,
    available: results[index]?.status === 'fulfilled',
  }));
  const annotate = (
    property: GoogleProperty,
    connection: GoogleConnectionRow,
  ) =>
    ({
      ...property,
      connectionId: connection.id,
      googleEmail: connection.google_email,
    }) satisfies GooglePropertyWithAccount;
  const fulfilled = results.flatMap((result, index) =>
    result.status === 'fulfilled'
      ? [{ properties: result.value, connection: connections[index]! }]
      : [],
  );
  const messages = fulfilled
    .map(({ properties }) => properties.gbpMessage)
    .filter((message): message is string => Boolean(message));
  const failedCount = results.filter(
    (result) => result.status === 'rejected',
  ).length;

  return {
    accounts,
    gsc: fulfilled.flatMap(({ properties, connection }) =>
      properties.gsc.map((property) => annotate(property, connection)),
    ),
    ga4: fulfilled.flatMap(({ properties, connection }) =>
      properties.ga4.map((property) => annotate(property, connection)),
    ),
    gbp: fulfilled.flatMap(({ properties, connection }) =>
      properties.gbp.map((property) => annotate(property, connection)),
    ),
    gbpAvailable: fulfilled.some(({ properties }) => properties.gbpAvailable),
    gbpMessage:
      messages[0] ??
      (failedCount > 0
        ? 'One or more Google accounts could not be read. Reconnect the affected account and try again.'
        : null),
  };
}

export async function listGoogleProperties(accessToken: string) {
  const [gscResponse, ga4Response, businessProfile] = await Promise.all([
    googleFetch('https://www.googleapis.com/webmasters/v3/sites', accessToken),
    googleFetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
      accessToken,
    ),
    listGoogleBusinessLocations(accessToken),
  ]);
  const gscPayload = gscResponse as {
    siteEntry?: Array<{ siteUrl: string; permissionLevel?: string }>;
  };
  const ga4Payload = ga4Response as {
    accountSummaries?: Array<{
      displayName?: string;
      propertySummaries?: Array<{
        property: string;
        displayName?: string;
        propertyType?: string;
      }>;
    }>;
  };

  return {
    gsc: (gscPayload.siteEntry ?? []).map((item) => ({
      id: item.siteUrl,
      name: item.siteUrl,
      note: item.permissionLevel ?? 'verified',
    })),
    ga4: (ga4Payload.accountSummaries ?? []).flatMap((account) =>
      (account.propertySummaries ?? []).map((property) => ({
        id: property.property,
        name: property.displayName ?? property.property,
        note: account.displayName ?? 'Google Analytics',
      })),
    ),
    gbp: businessProfile.locations,
    gbpAvailable: businessProfile.available,
    gbpMessage: businessProfile.message,
  };
}

async function listGoogleBusinessLocations(accessToken: string) {
  try {
    const accountsPayload = (await googleFetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      accessToken,
    )) as {
      accounts?: Array<{ name?: string; accountName?: string; type?: string }>;
    };
    const accounts = (accountsPayload.accounts ?? []).filter(
      (
        account,
      ): account is { name: string; accountName?: string; type?: string } =>
        Boolean(account.name?.startsWith('accounts/')),
    );
    const locationResults = await Promise.allSettled(
      accounts.slice(0, 25).map(async (account) => {
        const url = new URL(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
        );
        url.searchParams.set(
          'readMask',
          'name,title,storeCode,websiteUri,categories,storefrontAddress',
        );
        url.searchParams.set('pageSize', '100');
        const payload = (await googleFetch(url.toString(), accessToken)) as {
          locations?: Array<{
            name?: string;
            title?: string;
            storeCode?: string;
            websiteUri?: string;
            storefrontAddress?: {
              locality?: string;
              administrativeArea?: string;
            };
          }>;
        };
        return (payload.locations ?? []).flatMap((location) =>
          location.name
            ? [
                {
                  id: location.name,
                  name: location.title ?? location.name,
                  note: [
                    account.accountName,
                    location.storefrontAddress?.locality,
                    location.storefrontAddress?.administrativeArea,
                    location.websiteUri,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                },
              ]
            : [],
        );
      }),
    );
    return {
      available: true,
      message: null,
      locations: locationResults.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      ),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    return {
      available: false,
      message: detail.includes('403')
        ? 'Business Profile API access is not enabled or approved for this Google Cloud project.'
        : 'Business Profile locations could not be loaded.',
      locations: [] as Array<{ id: string; name: string; note: string }>,
    };
  }
}

export async function googleFetch(
  url: string,
  accessToken: string,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers);
  headers.set('authorization', `Bearer ${accessToken}`);
  headers.set('content-type', 'application/json');
  const response = await fetch(url, {
    ...init,
    headers,
  });
  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const detail = JSON.stringify(payload).slice(0, 500);
    throw new Error(`GOOGLE_API_FAILED:${response.status}:${detail}`);
  }
  return payload;
}

function errorDetail(value: unknown, fallback: number) {
  if (typeof value === 'string') return value;
  return value === undefined ? String(fallback) : JSON.stringify(value);
}

async function encryptionKey() {
  const encoded = googleConfiguration().encryptionKey;
  if (!encoded) throw new Error('TOKEN_ENCRYPTION_KEY_REQUIRED');
  const bytes = fromBase64Url(encoded);
  if (bytes.byteLength !== 32) throw new Error('TOKEN_ENCRYPTION_KEY_INVALID');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

async function decryptRefreshToken(ciphertext: string, nonce: string) {
  const key = await encryptionKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(nonce) },
    key,
    fromBase64Url(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
