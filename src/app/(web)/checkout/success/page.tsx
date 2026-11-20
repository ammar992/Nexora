import { notFound } from "next/navigation";
import { requirePageUser } from "@/server/auth/session";
import { Order } from "@/server/models/Order";
import { Booking } from "@/server/models/Booking";
import { CheckoutSuccess } from "@/components/templates/Checkout/Success";
import { toPlain } from "@/server/services/serialize";

export const metadata = { title: "Thank you" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ group?: string; booking?: string }> }) {
  const { group, booking } = await searchParams;
  const user = await requirePageUser(undefined, "/account");
  if (group) {
    const orders = await Order.find({ checkoutGroup: group, customer: user.id }).populate("vendor", "storeName").lean();
    if (!orders.length) notFound();
    return <CheckoutSuccess kind="order" orders={toPlain(orders) as never} />;
  }
  if (booking) {
    const b = await Booking.findOne({ reference: booking, customer: user.id }).populate("vendor", "storeName").lean();
    if (!b) notFound();
    return <CheckoutSuccess kind="booking" booking={toPlain(b) as never} />;
  }
  notFound();
}
