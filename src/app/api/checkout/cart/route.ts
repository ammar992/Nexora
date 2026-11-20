import { route, parseBody, ok } from "@/server/http";
import { cartCheckoutSchema } from "@/formik/schema/checkout";
import { requireUser } from "@/server/auth/session";
import { checkoutCart } from "@/server/services/checkout";
import { rateLimit } from "@/server/rateLimit";

export const POST = route(async (req) => {
  const user = await requireUser();
  await rateLimit("checkout", user.id, 10, 60 * 10);
  const body = await parseBody(req, cartCheckoutSchema);
  const result = await checkoutCart(user, body);
  return ok(result, { status: 201 });
});
