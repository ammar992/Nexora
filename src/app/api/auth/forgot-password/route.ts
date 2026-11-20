import { route, parseBody, ok } from "@/server/http";
import { forgotPasswordSchema } from "@/formik/schema/auth";
import { User } from "@/server/models/User";
import { issueToken } from "@/server/auth/tokens";
import { rateLimit, clientIp } from "@/server/rateLimit";
import { sendEmail } from "@/server/email/mailer";
import { emails } from "@/server/email/templates";
import { getSettings } from "@/server/services/settings";

export const POST = route(async (req) => {
  await rateLimit("forgot-ip", clientIp(req), 10, 60 * 15);
  const { email } = await parseBody(req, forgotPasswordSchema);
  await rateLimit("forgot-email", email, 3, 60 * 15);
  const user = await User.findOne({ email, isActive: true }).select("name email").lean();
  if (user) {
    const token = await issueToken(user._id, "reset_password");
    const settings = await getSettings();
    await sendEmail({ to: user.email, ...emails.resetPassword(settings.siteName, user.name, token) });
  }
  // Same response either way so the endpoint can't be used to discover accounts.
  return ok({ sent: true });
});
