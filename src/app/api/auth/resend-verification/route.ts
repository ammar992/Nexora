import { route, ok } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { issueToken } from "@/server/auth/tokens";
import { rateLimit } from "@/server/rateLimit";
import { sendEmail, isEmailConfigured } from "@/server/email/mailer";
import { emails } from "@/server/email/templates";
import { getSettings } from "@/server/services/settings";

export const POST = route(async () => {
  const user = await requireUser();
  if (user.emailVerified) return ok({ alreadyVerified: true });
  await rateLimit("resend-verify", user.id, 3, 60 * 15);
  const token = await issueToken(user.id, "verify_email");
  const settings = await getSettings();
  await sendEmail({ to: user.email, ...emails.verifyEmail(settings.siteName, user.name, token) });
  return ok({ sent: true, delivered: isEmailConfigured() });
});
