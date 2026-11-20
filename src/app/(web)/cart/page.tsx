import { Suspense } from "react";
import { CartTemplate } from "@/components/templates/Cart";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <Suspense>
      <CartTemplate />
    </Suspense>
  );
}
