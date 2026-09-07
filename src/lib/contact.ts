// ── Web3Forms contact config ──────────────────────────────────────
// 1. Go to https://web3forms.com and click "Create Access Key".
// 2. Enter YOUR developer email (where you want user messages to arrive).
// 3. You'll receive the Access Key by email — paste it below.
// The access key is an alias to your email and is SAFE to expose in
// client code (it is public by design), just like the Cloudinary keys.
export const WEB3FORMS_ACCESS_KEY = "01a3fce4-ad35-4385-920d-ab6079fc55f9";

interface ContactPayload {
  name: string;
  email: string;
  type: string; // e.g. "Suggestion", "Issue", "Other"
  message: string;
}

// ── Send a message from the user to the developer's email ─────────
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `[My Pocket] ${payload.type} — from ${payload.name}`,
      email: payload.email, // user's email → reply-to so you can follow up
      name: payload.name,
      type: payload.type,
      message: payload.message,
      botcheck: "", // hidden honeypot field Web3Forms checks for spam
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Failed to send your message. Please try again.");
  }
}
