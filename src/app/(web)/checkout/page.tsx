import { CheckoutTemplate } from "@/components/templates/Checkout";
import { requirePageUser } from "@/server/auth/session";
import { availableProviders } from "@/server/payments";
import { requireEmailVerification } from "@/server/env";
import { User } from "@/server/models/User";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await requirePageUser(undefined, "/checkout");
  const user = await User.findById(session.id).select("name phone address").lean();
  const a = user?.address;
  return (
    <CheckoutTemplate
      providers={availableProviders()}
      mustVerify={requireEmailVerification() && !session.emailVerified}
      defaults={{ name: user?.name ?? "", phone: user?.phone ?? "", line1: a?.line1 ?? "", line2: a?.line2 ?? "", city: a?.city ?? "", state: a?.state ?? "", postalCode: a?.postalCode ?? "", country: a?.country ?? "" }}
    />
  );
}
