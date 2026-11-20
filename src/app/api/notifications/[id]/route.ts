import { route, ok, assertObjectId } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { Notification } from "@/server/models/Notification";

export const PATCH = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  assertObjectId(id, "notification");
  await Notification.updateOne({ _id: id, user: user.id }, { $set: { read: true } });
  return ok({ read: true });
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  assertObjectId(id, "notification");
  await Notification.deleteOne({ _id: id, user: user.id });
  return ok({ deleted: true });
});
