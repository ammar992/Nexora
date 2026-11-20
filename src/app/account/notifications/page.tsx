import { requirePageUser } from "@/server/auth/session";
import { Notification } from "@/server/models/Notification";
import { toPlain } from "@/server/services/serialize";
import { PageHeader } from "@/components/organisms/dashboard/PageHeader";
import { NotificationsList } from "@/components/organisms/dashboard/NotificationsList";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requirePageUser();
  const items = await Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(100).lean();
  return (
    <>
      <PageHeader title="Notifications" description="Updates about your orders, bookings and account." />
      <NotificationsList items={toPlain(items) as never} />
    </>
  );
}
