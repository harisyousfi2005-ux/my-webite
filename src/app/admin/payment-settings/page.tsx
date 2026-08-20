import { authedBackendFetch } from "@/lib/server/session";
import { PaymentSettingsForm } from "@/components/admin/PaymentSettingsForm";
import type { PaymentSettingsAdmin } from "@/types";

export const dynamic = "force-dynamic";

export default async function PaymentSettingsPage() {
  const settings = await authedBackendFetch<PaymentSettingsAdmin>("/payments/settings");

  return (
    <div>
      <h2 className="font-display text-2xl uppercase text-ink">Payment Settings</h2>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Control which payment methods customers see and whether the site is in DEMO mode (safe
        to demo, no real money moves) or LIVE mode (real gateways are used).
      </p>

      <div className="mt-8">
        <PaymentSettingsForm initialSettings={settings} />
      </div>
    </div>
  );
}
