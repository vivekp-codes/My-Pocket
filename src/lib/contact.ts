// ── EmailJS contact config ─────────────────────────────────────────
// 1. Go to https://www.emailjs.com and create a free account.
// 2. Add an Email Service (e.g. Gmail, Outlook) and an Email Template.
// 3. Grab your Service ID, Template ID, and Public Key from the dashboard.
// 4. Paste them into .env (see .env.example for the variable names).
//
// NOTE: The Public Key is safe to expose in client code. Never commit
// your Private Key or SMTP credentials here.
export const EMAILJS_SERVICE_ID: string = import.meta.env.VITE_EMAILJS_SERVICE_ID;
export const EMAILJS_TEMPLATE_ID: string = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
export const EMAILJS_PUBLIC_KEY: string = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface ContactPayload {
  name: string;
  email: string;
  type: string; // e.g. "Suggestion", "Issue", "Other"
  message: string;
}

// ── Send a message from the user to the developer's email ─────────
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const emailjs = (await import("@emailjs/browser")).default;

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      subject: `[My Pocket] ${payload.type} — from ${payload.name}`,
      from_name: payload.name,
      reply_to: payload.email,
      type: payload.type,
      message: payload.message,
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  );
}
