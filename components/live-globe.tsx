'use client';

import createGlobe from 'cobe';
import { useEffect, useMemo, useRef } from 'react';

type LiveLocation = {
  city: string;
  country: string;
  activeUsers: number;
};

const CITY_COORDINATES: Record<string, [number, number]> = {
  ashburn: [39.0438, -77.4874],
  dublin: [53.3498, -6.2603],
  cork: [51.8985, -8.4756],
  galway: [53.2707, -9.0568],
  limerick: [52.6638, -8.6267],
  waterford: [52.2593, -7.1101],
  phoenix: [33.4484, -112.074],
  gilbert: [33.3528, -111.789],
  mesa: [33.4152, -111.8315],
  tucson: [32.2226, -110.9747],
  london: [51.5072, -0.1276],
  newyork: [40.7128, -74.006],
  chicago: [41.8781, -87.6298],
  losangeles: [34.0522, -118.2437],
  karachi: [24.8607, 67.0011],
  lahore: [31.5204, 74.3587],
  islamabad: [33.6844, 73.0479],
  sydney: [-33.8688, 151.2093],
  singapore: [1.3521, 103.8198],
  tokyo: [35.6762, 139.6503],
};

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  ireland: [53.1424, -7.6921],
  'united states': [39.8283, -98.5795],
  usa: [39.8283, -98.5795],
  pakistan: [30.3753, 69.3451],
  india: [20.5937, 78.9629],
  'united kingdom': [55.3781, -3.436],
  canada: [56.1304, -106.3468],
  australia: [-25.2744, 133.7751],
  germany: [51.1657, 10.4515],
  france: [46.2276, 2.2137],
};

function markerLocation(location: LiveLocation): [number, number] | null {
  const cityKey = location.city.toLowerCase().replaceAll(/[^a-z]/gu, '');
  return (
    CITY_COORDINATES[cityKey] ??
    COUNTRY_COORDINATES[location.country.toLowerCase()] ??
    null
  );
}

export function LiveGlobe({
  locations,
  activeUsers,
}: {
  locations: LiveLocation[];
  activeUsers: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markers = useMemo(
    () =>
      locations
        .map((location) => {
          const locationCoordinates = markerLocation(location);
          if (!locationCoordinates) return null;
          return {
            location: locationCoordinates,
            size: Math.min(0.13, 0.045 + location.activeUsers * 0.012),
          };
        })
        .filter((marker): marker is NonNullable<typeof marker> =>
          Boolean(marker),
        )
        .slice(0, 10),
    [locations],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let phi = 0;
    let width = canvas.offsetWidth;
    const resizeObserver = new ResizeObserver(() => {
      width = canvas.offsetWidth;
    });
    resizeObserver.observe(canvas);
    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.22,
      dark: 1,
      diffuse: 1.25,
      mapSamples: 18_000,
      mapBrightness: 7,
      baseColor: [0.025, 0.075, 0.11],
      markerColor: [0.965, 0.235, 0.075],
      glowColor: [0.12, 0.28, 0.38],
      markers,
    });
    let animationFrame = 0;
    const animate = () => {
      phi += 0.0032;
      globe.update({ phi, width: width * 2, height: width * 2 });
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      globe.destroy();
    };
  }, [markers]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[510px]">
      <div className="absolute inset-[13%] rounded-full bg-primary/8 blur-3xl" />
      <canvas
        ref={canvasRef}
        className="relative z-10 aspect-square h-auto w-full opacity-95"
        aria-label="Rotating globe showing live visitor locations"
      />
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
        <div className="rounded-2xl border border-white/10 bg-[#081018]/80 px-4 py-3 text-center shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#75dca8]">
            <span className="size-2 animate-pulse rounded-full bg-[#4cc98a]" />
            Live now
          </div>
          <div className="mt-1 text-4xl font-semibold tracking-[-0.05em] text-white">
            {activeUsers}
          </div>
          <p className="text-[10px] text-muted-foreground">active visitors</p>
        </div>
      </div>
    </div>
  );
}
