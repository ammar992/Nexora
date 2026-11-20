import * as yup from "yup";
import { route, parseBody, ok } from "@/server/http";
import { rateLimit, clientIp } from "@/server/rateLimit";
import { sendEmail } from "@/server/email/mailer";
import { getSettings } from "@/server/services/settings";
import { notifyAdmins } from "@/server/services/notifications";

const schema = yup.object({
  name: yup.string().trim().min(2).max(80).required(),
  email: yup.string().trim().email().max(160).required(),
  subject: yup.string().trim().max(120).default("General enquiry"),
  message: yup.string().trim().min(10).max(3000).required(),
});

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const POST = route(async (req) => {
  await rateLimit("contact", clientIp(req), 5, 60 * 30);
  const b = await parseBody(req, schema);
  const settings = await getSettings();
  const to = settings.contact?.email || process.env.ADMIN_EMAIL;
  if (to) {
    await sendEmail({
      to,
      replyTo: b.email,
      subject: `[Contact] ${b.subject}`,
      text: `From: ${b.name} <${b.email}>\n\n${b.message}`,
      html: `<p><strong>From:</strong> ${esc(b.name)} &lt;${esc(b.email)}&gt;</p><p style="white-space:pre-line">${esc(b.message)}</p>`,
    });
  }
  await notifyAdmins({ type: "message", title: `Contact form: ${b.subject}`, body: `${b.name} (${b.email}): ${b.message.slice(0, 200)}` });
  return ok({ sent: true });
});
