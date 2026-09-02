// Minimal transactional email over Resend's HTTP API — no npm dependency, just
// a raw fetch (same approach the forgot-password route uses). When
// RESEND_API_KEY is unset (local/dev/preview), the message is logged instead of
// sent, so email-dependent flows still work end-to-end without a provider.
type SendArgs = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] (dev — not sent) to=${to} subject="${subject}"`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Vertlix AI <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) console.error("[email] resend responded", res.status);
    return { sent: res.ok };
  } catch (e) {
    console.error("[email] send failed", e);
    return { sent: false };
  }
}

// Shared markup so verification/reset emails look consistent.
export function verificationEmailHtml(link: string): string {
  return `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1f2328">
    <h2 style="font-size:18px;margin:0 0 12px">Confirm your email · Vertlix AI</h2>
    <p style="font-size:14px;line-height:1.6;color:#475569">
      Thanks for signing up for Vertlix AI. Confirm your email to activate your account:
    </p>
    <p style="margin:20px 0">
      <a href="${link}" style="display:inline-block;padding:11px 20px;border-radius:10px;background:#6D28D9;color:#fff;font-weight:600;font-size:14px;text-decoration:none">
        Confirm email
      </a>
    </p>
    <p style="font-size:12px;line-height:1.6;color:#94a3b8">
      The link is valid for 24 hours. If you didn\u2019t sign up, just ignore this email.
    </p>
  </div>`;
}
