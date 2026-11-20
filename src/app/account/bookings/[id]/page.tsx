import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { getBookingForViewer } from "@/server/services/dashboard";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { BookingDetail } from "@/components/organisms/commerce/BookingsView";
import { formatDateTime } from "@/resources/utils/format";

export const metadata = { title: "Booking" };

export default async function AccountBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const booking = await getBookingForViewer(id, user);
  if (!booking) notFound();
  const slug = (booking.listing as unknown as { slug?: string } | null)?.slug;
  return (
    <>
      <PageHeader title={`Booking ${booking.reference}`} description={`Requested ${formatDateTime(booking.createdAt)}`} back={{ href: "/account/bookings", label: "All bookings" }} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <BookingDetail booking={booking as never} audience="customer" />
        </Panel>
        {booking.status === "completed" && slug && (
          <Panel title="How did it go?">
            <p className="text-sm text-muted">Leave a review to help others choose.</p>
            <Link href={`/listing/${slug}#reviews`} className="mt-4 flex items-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-accent">
              <Star className="size-4 text-accent" /> Write a review
            </Link>
          </Panel>
        )}
      </div>
    </>
  );
}
