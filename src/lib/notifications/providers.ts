import type { EmailProvider } from "./types";

/**
 * Provider selection happens at dispatch time, not module load, so tests
 * and scripts can control the environment. Without RESEND_API_KEY the
 * console provider "delivers" by printing; email_log rows still record
 * the full lifecycle, which keeps dev honest about what would ship.
 */

const CONSOLE_PROVIDER: EmailProvider = {
  name: "console",
  async send(message) {
    console.info(`[email:${this.name}] → ${message.to} | ${message.subject}\n${message.text}`);
  },
};

export function createResendProvider(apiKey: string): EmailProvider {
  return {
    name: "resend",
    async send(message) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`);
      }
    },
  };
}

export interface ResolvedEmailChannel {
  provider: EmailProvider;
  from: string;
}

export function resolveEmailChannel(
  env: Record<string, string | undefined> = process.env,
): ResolvedEmailChannel {
  const apiKey = env.RESEND_API_KEY?.trim();
  const provider = apiKey ? createResendProvider(apiKey) : CONSOLE_PROVIDER;
  const from = env.EMAIL_FROM?.trim() || "Grooma <bookings@localhost>";
  return { provider, from };
}
