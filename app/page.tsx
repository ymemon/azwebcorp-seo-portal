/* oxlint-disable next/no-html-link-for-pages -- native navigation avoids a broken client-side transition in the hosted portal */
import Image from 'next/image';
import {
  ArrowRight,
  BarChart3,
  Check,
  LockKeyhole,
  Search,
  Zap,
} from 'lucide-react';

import { chatGPTSignInPath, getChatGPTUser } from '@/app/chatgpt-auth';

export default async function Home() {
  const user = await getChatGPTUser();

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.025)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      <div className="pointer-events-none absolute left-[62%] top-[-20rem] -z-10 h-[42rem] w-[42rem] rounded-full bg-primary/12 blur-[120px]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Image
          src="/azwebcorp-logo.png"
          alt="AZ Web Corp"
          width={226}
          height={73}
          className="brand-logo h-auto w-36 sm:w-44"
          priority
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5 text-[#4cc98a]" />
          Private client access
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-105px)] w-full max-w-7xl items-center gap-14 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-4">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-[#ff8a70]">
            <Zap className="size-3.5" />
            Your organic growth command center
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.5rem] lg:leading-[1.02]">
            SEO performance,
            <span className="block text-[#f63c13]">made unmistakable.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-[#aab2bd] sm:text-lg">
            Search Console, Analytics and the work that moves your
            rankings—brought together in one secure client view.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <a
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_32px_rgb(246_60_19/24%)] transition hover:bg-primary/90"
              >
                Continue to your dashboard
                <ArrowRight className="size-4" />
              </a>
            ) : (
              <a
                href={chatGPTSignInPath('/dashboard')}
                target="_top"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_32px_rgb(246_60_19/24%)] transition hover:bg-primary/90"
              >
                Sign in to your dashboard
                <ArrowRight className="size-4" />
              </a>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {[
              'Read-only Google access',
              'Tenant-isolated data',
              'Clear freshness labels',
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="size-4 text-[#4cc98a]" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mr-0">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/18 via-transparent to-[#e6b84d]/10 blur-2xl" />
          <div className="panel-glow overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#101720]/92 p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/8 px-3 pb-3 pt-1">
              <div className="flex gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <span className="size-2 rounded-full bg-[#e6b84d]" />
                <span className="size-2 rounded-full bg-[#4cc98a]" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Live portal preview
              </span>
            </div>
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  Search clicks <Search className="size-4 text-primary" />
                </div>
                <div className="mt-5 text-3xl font-semibold tracking-tight">
                  2,184
                </div>
                <div className="mt-1 text-xs font-medium text-[#4cc98a]">
                  ↑ 18.4% vs previous period
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/15 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  Active now <Zap className="size-4 text-[#e6b84d]" />
                </div>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    23
                  </span>
                  <span className="mb-1 size-2 animate-pulse rounded-full bg-[#4cc98a]" />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Last 30 minutes
                </div>
              </div>
              <div className="relative col-span-full h-52 overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgb(246_60_19/9%),transparent)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Organic visibility
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      Clicks and impressions
                    </p>
                  </div>
                  <BarChart3 className="size-5 text-primary" />
                </div>
                <svg
                  viewBox="0 0 520 120"
                  className="absolute inset-x-4 bottom-4 h-28 w-[calc(100%-2rem)]"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="hero-line-fill"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f63c13"
                        stopOpacity="0.32"
                      />
                      <stop offset="100%" stopColor="#f63c13" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 96 C45 91 70 69 111 74 C151 79 176 45 219 54 C258 62 282 31 325 38 C367 46 397 17 438 24 C471 28 493 10 520 12 L520 120 L0 120 Z"
                    fill="url(#hero-line-fill)"
                  />
                  <path
                    d="M0 96 C45 91 70 69 111 74 C151 79 176 45 219 54 C258 62 282 31 325 38 C367 46 397 17 438 24 C471 28 493 10 520 12"
                    fill="none"
                    stroke="#f63c13"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
