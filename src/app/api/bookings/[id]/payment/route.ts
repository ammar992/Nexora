import { route, ok, assertObjectId } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { recordManualPayment } from "@/server/services/fulfillment";

/** Vendor/admin confirms an offline (pay at appointment) payment was received. */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser(["vendor", "admin"]);
  const { id } = await params;
  assertObjectId(id, "booking");
  await recordManualPayment("booking", id, user);
  return ok({ paid: true });
});
