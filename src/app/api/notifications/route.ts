import { route, ok } from "@/server/http";
import { requireUser } from "@/server/auth/session";
import { Notification } from "@/server/models/Notification";

export const GET = route(async () => {
  const user = await requireUser();
  const [items, unread] = await Promise.all([
    Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: user.id, read: false }),
  ]);
  return ok({ items, unread });
});

/** Marks all notifications as read. */
export const PATCH = route(async () => {
  const user = await requireUser();
  await Notification.updateMany({ user: user.id, read: false }, { $set: { read: true } });
  return ok({ unread: 0 });
});
