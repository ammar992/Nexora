import { route, ok, assertObjectId } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { recordManualPayment } from "@/server/services/fulfillment";

/** Vendor/admin confirms an offline (pay on delivery) payment was received. */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["vendor", "admin"]);
  const { id } = await params;
  assertObjectId(id, "order");
  await recordManualPayment("order", id, user);
  return ok({ paid: true });
});
