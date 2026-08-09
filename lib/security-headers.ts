export type SecurityHeader = {
  key: string;
  value: string;
};

export const SECURITY_HEADERS: SecurityHeader[] = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
];

export function securityHeaderValue(key: string) {
  return SECURITY_HEADERS.find((header) => header.key === key)?.value;
}
