import { route, parseBody, ok, ApiError } from "@/server/http";
import { registerSchema } from "@/formik/schema/auth";
import { User } from "@/server/models/User";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { issueToken } from "@/server/auth/tokens";
import { rateLimit, clientIp } from "@/server/rateLimit";
import { sendEmail } from "@/server/email/mailer";
import { emails } from "@/server/email/templates";
import { getSettings } from "@/server/services/settings";

export const POST = route(async (req) => {
  await rateLimit("register", clientIp(req), 5, 60 * 15);
  const body = await parseBody(req, registerSchema);
  if (await User.exists({ email: body.email })) {
    throw new ApiError(409, "An account with this email already exists. Try signing in instead.", { email: "Already registered" });
  }
  const user = await User.create({
    name: body.name,
    email: body.email,
    passwordHash: await hashPassword(body.password),
    role: "customer", // vendors start as customers and apply from /become-vendor
  });
  const token = await issueToken(user._id, "verify_email");
  const settings = await getSettings();
  await sendEmail({ to: user.email, ...emails.verifyEmail(settings.siteName, user.name, token) });
  await createSession(user);
  return ok({ id: user._id.toString(), next: body.accountType === "vendor" ? "/become-vendor" : "/account" }, { status: 201 });
});
