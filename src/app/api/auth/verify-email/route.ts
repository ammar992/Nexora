import * as yup from "yup";
import { route, parseBody, ok, ApiError } from "@/server/http";
import { consumeToken } from "@/server/auth/tokens";
import { User } from "@/server/models/User";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const POST = route(async (req) => {
  await rateLimit("verify", clientIp(req), 20, 60 * 15);
  const { token } = await parseBody(req, yup.object({ token: yup.string().required() }));
  const userId = await consumeToken(token, "verify_email");
  if (!userId) throw new ApiError(400, "This verification link is invalid or has expired. Request a new one from your account.");
  await User.updateOne({ _id: userId }, { $set: { emailVerified: true } });
  return ok({ verified: true });
});
