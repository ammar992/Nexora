import { route, parseBody, ok, assertObjectId } from "@/server/http";
import { statusUpdateSchema } from "@/formik/schema/checkout";
import { requireUser } from "@/server/auth/session";
import { updateOrderStatus } from "@/server/services/fulfillment";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  assertObjectId(id, "order");
  const body = await parseBody(req, statusUpdateSchema);
  const status = await updateOrderStatus(id, user, body.status, { note: body.note, trackingNumber: body.trackingNumber });
  return ok({ status });
});
