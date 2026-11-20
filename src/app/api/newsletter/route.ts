import { route, parseBody, ok } from "@/server/http";
import { newsletterSchema } from "@/formik/schema/auth";
import { Subscriber } from "@/server/models/Subscriber";
import { rateLimit, clientIp } from "@/server/rateLimit";

export const POST = route(async (req) => {
  await rateLimit("newsletter", clientIp(req), 5, 60 * 10);
  const { email } = await parseBody(req, newsletterSchema);
  await Subscriber.updateOne({ email }, { $setOnInsert: { email, source: "homepage" }, $unset: { unsubscribedAt: 1 } }, { upsert: true });
  return ok({ subscribed: true });
});
