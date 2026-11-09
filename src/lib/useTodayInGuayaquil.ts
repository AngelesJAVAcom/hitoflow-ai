"use client";

import { useSyncExternalStore } from "react";
import { todayInGuayaquil } from "@/lib/rescheduling";

function subscribe(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(timer);
}

function getSnapshot() {
  return todayInGuayaquil();
}

function getServerSnapshot() {
  return "";
}

export function useTodayInGuayaquil() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
