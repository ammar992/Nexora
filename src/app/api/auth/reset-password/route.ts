import { route, parseBody, ok, ApiError } from "@/server/http";
import { resetPasswordSchema } from "@/formik/schema/auth";
import { User } from "@/server/models/User";
import { consumeToken } from "@/server/auth/tokens";
import { hashPassword } from "@/server/auth/password";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const POST = route(async (req) => {
  await rateLimit("reset", clientIp(req), 10, 60 * 15);
  const { token, password } = await parseBody(req, resetPasswordSchema);
  const userId = await consumeToken(token, "reset_password");
  if (!userId) throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
  // Bumping tokenVersion signs out every existing session.
  await User.updateOne(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(password), emailVerified: true }, $inc: { tokenVersion: 1 } }
  );
  return ok({ reset: true });
});
