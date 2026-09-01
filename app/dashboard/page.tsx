import type { Metadata } from 'next';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { SeoDashboard } from '@/components/seo-dashboard';
import { getPortalAccess } from '@/lib/portal';

export const metadata: Metadata = {
  title: 'Client Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireChatGPTUser('/dashboard');
  const access = getPortalAccess(user);

  if (!access.siteIds.length)
    return (
      <main className="grid min-h-screen place-items-center bg-[#07090d] p-6 text-center text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-[#101720] p-8">
          <h1 className="text-2xl font-semibold">
            Your portal invite is active
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#aab2bd]">
            Your account still needs to be assigned to a client workspace. Ask
            AZ Web Corp to finish the workspace assignment for {user.email}.
          </p>
        </div>
      </main>
    );

  return (
    <SeoDashboard
      userName={user.displayName}
      signOutHref={chatGPTSignOutPath('/')}
      workspaceIds={access.siteIds}
      isAgencyAdmin={access.isAgencyAdmin}
    />
  );
}
