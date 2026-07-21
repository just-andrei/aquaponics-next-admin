"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { usePublicTheme } from "@/components/public/PublicThemeProvider";

function WaterFallback() {
  return <div aria-hidden="true" className="public-water-fallback absolute inset-0" />;
}

const LiquidEther = dynamic(() => import("@/components/effects/LiquidEther"), {
  ssr: false,
  loading: WaterFallback,
});

const LIGHT_WATER_COLORS = ["#2563EB", "#00BDEB", "#00A884"];
const DARK_WATER_COLORS = ["#0284C7", "#06B6D4", "#14B8A6"];

function subscribeToReducedMotion(onStoreChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const LIGHTWEIGHT_BACKGROUND_QUERY =
  "(max-width: 767px), (pointer: coarse), (update: slow)";

function subscribeToLightweightBackground(onStoreChange: () => void) {
  const query = window.matchMedia(LIGHTWEIGHT_BACKGROUND_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getLightweightBackgroundSnapshot() {
  return window.matchMedia(LIGHTWEIGHT_BACKGROUND_QUERY).matches;
}

function subscribeToHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

export function ThemeAwareLiquidEther() {
  const { theme } = usePublicTheme();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => true,
  );
  const prefersLightweightBackground = useSyncExternalStore(
    subscribeToLightweightBackground,
    getLightweightBackgroundSnapshot,
    () => true,
  );

  if (!isHydrated) {
    return <WaterFallback />;
  }

  if (prefersReducedMotion || prefersLightweightBackground) {
    return <WaterFallback />;
  }

  return (
    <LiquidEther
      autoDemo
      autoIntensity={1.6}
      autoRampDuration={0.6}
      autoResumeDelay={3000}
      autoSpeed={0.25}
      className="absolute inset-0"
      colors={theme === "dark" ? DARK_WATER_COLORS : LIGHT_WATER_COLORS}
      cursorSize={80}
      isBounce={false}
      isViscous={false}
      iterationsPoisson={16}
      iterationsViscous={32}
      maxDpr={1.5}
      mouseForce={14}
      resolution={0.3}
      takeoverDuration={0.25}
      viscous={30}
    />
  );
}

export { DARK_WATER_COLORS, LIGHT_WATER_COLORS };
