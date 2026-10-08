// "Is this URL pointing at my own machine?" Shared by the seed guard and the
// POC readiness report (Phase 0, 2026-10-08). Fails closed: anything that is
// missing, malformed, or not a loopback host counts as hosted.

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLocalUrl(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    return LOOPBACK_HOSTS.has(new URL(value.trim()).hostname.toLowerCase());
  } catch {
    return false;
  }
}
