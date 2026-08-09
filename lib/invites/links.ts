const FALLBACK_APP_URL = "http://localhost:3000";

export function buildInviteLink(appUrl: string | undefined, inviteId: string) {
  const baseUrl = (appUrl || FALLBACK_APP_URL).replace(/\/+$/, "");
  return `${baseUrl}/accept-invite?invite=${encodeURIComponent(inviteId)}`;
}
