import { route, parseBody, ok, ApiError } from "@/server/http";
import { changePasswordSchema } from "@/formik/schema/auth";
import { requireUser, createSession } from "@/server/auth/session";
import { User } from "@/server/models/User";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { rateLimit } from "@/server/rateLimit";

export const POST = route(async (req) => {
  const session = await requireUser();
  await rateLimit("change-password", session.id, 5, 60 * 15);
  const body = await parseBody(req, changePasswordSchema);
  const user = await User.findById(session.id).select("+passwordHash");
  if (!user) throw new ApiError(404, "Account not found.");
  if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
    throw new ApiError(400, "Your current password is incorrect.", { currentPassword: "Incorrect password" });
  }
  user.passwordHash = await hashPassword(body.newPassword);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  // Other devices are signed out; keep this one signed in with a fresh token.
  await createSession(user);
  return ok({ changed: true });
});
