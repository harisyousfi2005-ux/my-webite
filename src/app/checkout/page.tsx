import { requireServerUser, authedBackendFetch } from "@/lib/server/session";
import { backendFetch } from "@/lib/server/backendFetch";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import type { Address, PaymentSettingsPublic } from "@/types";

export default async function CheckoutPage() {
  const user = await requireServerUser("/checkout");
  const [addresses, paymentSettings] = await Promise.all([
    authedBackendFetch<Address[]>("/users/me/addresses"),
    backendFetch<PaymentSettingsPublic>("/payments/settings/public"),
  ]);

  return (
    <CheckoutForm user={user} initialAddresses={addresses} paymentSettings={paymentSettings} />
  );
}
