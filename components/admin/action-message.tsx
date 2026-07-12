"use client";

export function ActionMessage({ ok, message }: { ok: boolean; message: string }) {
  if (!message) return null;

  return <p className={ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{message}</p>;
}
