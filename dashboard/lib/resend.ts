export async function sendOTPEmail(to: string, otp: string): Promise<void> {
  const formatted = `${otp.slice(0, 3)} ${otp.slice(3)}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.OTP_FROM_EMAIL || "onboarding@resend.dev",
      to,
      subject: `Your Solutions AI code: ${formatted}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:36px 32px;background:#0d1117;color:#c9d1d9;border-radius:12px;border:1px solid #21262d">
          <p style="font-size:13px;color:#6e7a96;margin:0 0 24px">Solutions Central</p>
          <h2 style="color:#e6edf3;font-size:18px;font-weight:700;margin:0 0 8px">Your sign-in code</h2>
          <p style="color:#6e7a96;font-size:14px;margin:0 0 24px">Enter this code in the extension to sign in.</p>
          <div style="font-size:38px;font-weight:700;letter-spacing:10px;color:#e6edf3;font-family:ui-monospace,monospace;text-align:center;padding:24px;background:#161b27;border-radius:8px;border:1px solid #21262d;margin-bottom:24px">
            ${formatted}
          </div>
          <p style="color:#6e7a96;font-size:13px;margin:0">Valid for <strong style="color:#c9d1d9">10 minutes</strong>. Do not share this code with anyone.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
  }
}
