import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { requirePageUser } from "@/server/auth/session";
import { getOrderForViewer } from "@/server/services/dashboard";
import { PageHeader, Panel } from "@/components/organisms/dashboard/PageHeader";
import { OrderDetail } from "@/components/organisms/commerce/OrdersView";
import { Listing } from "@/server/models/Listing";
import { formatDateTime } from "@/resources/utils/format";

export const metadata = { title: "Order" };

export default async function AccountOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const order = await getOrderForViewer(id, user);
  if (!order) notFound();
  const slugs = order.status === "delivered" ? await Listing.find({ _id: { $in: order.items.map((i) => i.listing) } }).select("slug title").lean() : [];
  return (
    <>
      <PageHeader title={`Order ${order.reference}`} description={`Placed ${formatDateTime(order.createdAt)}`} back={{ href: "/account/orders", label: "All orders" }} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <OrderDetail order={order as never} audience="customer" />
        </Panel>
        {slugs.length > 0 && (
          <Panel title="How was it?">
            <p className="text-sm text-muted">Your order arrived. A short review helps other customers and the maker.</p>
            <ul className="mt-4 space-y-2">
              {slugs.map((l) => (
                <li key={String(l._id)}>
                  <Link href={`/listing/${l.slug}#reviews`} className="flex items-center gap-2 rounded-2xl border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-accent">
                    <Star className="size-4 text-accent" /> Review {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
