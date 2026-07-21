// WebAuthn / passkey relying-party config. The RP ID must be the site's
// registrable domain (no scheme, no port); the origin is the full URL the
// browser sees. Both derive from NEXTAUTH_URL so prod and local Just Work.
export const RP_NAME = "Vertlix AI";

export function getRpOrigin(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export function getRpID(): string {
  try {
    return new URL(getRpOrigin()).hostname;
  } catch {
    return "localhost";
  }
}
