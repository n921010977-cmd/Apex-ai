// Server-side password policy — mirrors the strength meter shown on /register so
// the backend enforces what the UI promises. Deliberately pragmatic: length is
// the dominant signal, plus a letters-and-digits mix to reject trivial inputs.
// Returns a Russian error string when the password is too weak, or null when OK.
export function validatePasswordStrength(pw: string): string | null {
  if (!pw || pw.length < 8) return "Password must be at least 8 characters";
  if (!/[a-zа-яё]/i.test(pw)) return "Password must contain letters";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one digit";
  return null;
}
