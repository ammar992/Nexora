import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getSettings } from "@/server/services/settings";

let transporter: Transporter | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

export type MailInput = { to: string; subject: string; html: string; text: string; replyTo?: string };

/**
 * Sends an email. When SMTP is not configured, the message is printed to the server console
 * so flows like email verification can still be completed in local development.
 * Never throws — email failures must not break the request that triggered them.
 */
export async function sendEmail(input: MailInput): Promise<boolean> {
  try {
    const settings = await getSettings();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@nexora.local";
    const from = fromAddress.includes("<") ? fromAddress : `"${settings.email?.fromName || settings.siteName}" <${fromAddress}>`;
    const t = getTransporter();
    if (!t) {
      console.info(`\n[email:console] To: ${input.to}\nSubject: ${input.subject}\n${input.text}\n`);
      return false;
    }
    await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo || settings.email?.replyTo || undefined,
    });
    return true;
  } catch (err) {
    console.error("[email] failed to send", input.subject, err);
    return false;
  }
}
