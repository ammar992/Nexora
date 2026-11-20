import { route, ok, ApiError } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { sendEmail, isEmailConfigured } from "@/server/email/mailer";
import { emails } from "@/server/email/templates";
import { getSettings } from "@/server/services/settings";
import { rateLimit } from "@/server/rateLimit";

export const POST = route(async () => {
  const admin = await requireUser(["admin"]);
  await rateLimit("test-email", admin.id, 5, 60 * 10);
  if (!isEmailConfigured()) {
    throw new ApiError(409, "SMTP isn't configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in your environment, then restart the server.");
  }
  const settings = await getSettings();
  const sent = await sendEmail({ to: admin.email, ...emails.test(settings.siteName) });
  if (!sent) throw new ApiError(502, "The SMTP server rejected the message. Check the server logs for details.");
  return ok({ sentTo: admin.email });
});
