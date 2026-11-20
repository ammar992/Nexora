import bcrypt from "bcryptjs";
import { route, parseBody, ok, ApiError } from "@/server/http";
import { loginSchema } from "@/formik/schema/auth";
import { User } from "@/server/models/User";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { rateLimit, clientIp } from "@/server/rateLimit";

// Compare against a dummy hash when the user doesn't exist so response timing doesn't reveal accounts.
const DUMMY_HASH = bcrypt.hashSync("nexora-timing-guard", 12);

export const POST = route(async (req) => {
  const ip = clientIp(req);
  await rateLimit("login-ip", ip, 20, 60 * 15);
  const body = await parseBody(req, loginSchema);
  await rateLimit("login-email", body.email, 8, 60 * 15);

  const user = await User.findOne({ email: body.email }).select("+passwordHash");
  const valid = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, "That email and password don't match. Please try again.");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated. Contact support if you think this is a mistake.");

  user.lastLoginAt = new Date();
  await user.save();
  await createSession(user);
  const home = user.role === "admin" ? "/admin" : user.role === "vendor" ? "/vendor" : "/account";
  return ok({ role: user.role, home });
});
