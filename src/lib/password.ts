// Server-side password policy — mirrors the strength meter shown on /register so
// the backend enforces what the UI promises. Deliberately pragmatic: length is
// the dominant signal, plus a letters-and-digits mix to reject trivial inputs.
// Returns a Russian error string when the password is too weak, or null when OK.
export function validatePasswordStrength(pw: string): string | null {
  if (!pw || pw.length < 8) return "Пароль должен быть не короче 8 символов";
  if (!/[a-zа-яё]/i.test(pw)) return "Пароль должен содержать буквы";
  if (!/[0-9]/.test(pw)) return "Пароль должен содержать хотя бы одну цифру";
  return null;
}
