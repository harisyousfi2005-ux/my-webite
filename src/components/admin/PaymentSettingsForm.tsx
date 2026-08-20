"use client";

import { useState } from "react";
import { setPaymentMode, upsertProviderConfig } from "@/lib/payments";
import { ApiError } from "@/lib/api";
import type { PaymentMode, PaymentProviderAdmin, PaymentSettingsAdmin } from "@/types";

const inputClass =
  "w-full border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-ink focus:outline-none";
const labelClass = "font-mono text-xs uppercase tracking-[0.1em] text-ink-soft";
const sectionClass = "border border-line p-6";
const buttonClass =
  "border border-ink bg-ink px-5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-paper transition-opacity hover:opacity-80 disabled:opacity-50";

function findProvider(settings: PaymentSettingsAdmin, provider: string): PaymentProviderAdmin {
  return (
    settings.providers.find((p) => p.provider === provider) ?? {
      provider: provider as PaymentProviderAdmin["provider"],
      enabled: true,
      publicConfig: null,
      hasSecretConfigured: false,
      updatedAt: null,
    }
  );
}

export function PaymentSettingsForm({ initialSettings }: { initialSettings: PaymentSettingsAdmin }) {
  const [settings, setSettings] = useState(initialSettings);

  function updateProvider(updated: PaymentProviderAdmin) {
    setSettings((prev) => ({
      ...prev,
      providers: prev.providers.some((p) => p.provider === updated.provider)
        ? prev.providers.map((p) => (p.provider === updated.provider ? updated : p))
        : [...prev.providers, updated],
    }));
  }

  return (
    <div className="flex flex-col gap-8">
      <ModeSection
        mode={settings.mode}
        onChange={(mode) => setSettings((prev) => ({ ...prev, mode }))}
      />
      <BankTransferSection
        provider={findProvider(settings, "BANK_TRANSFER")}
        onSaved={updateProvider}
      />
      <JazzCashSection provider={findProvider(settings, "JAZZCASH")} onSaved={updateProvider} />
      <EasypaisaSection provider={findProvider(settings, "EASYPAISA")} onSaved={updateProvider} />
      <CardSection provider={findProvider(settings, "CARD")} onSaved={updateProvider} />
    </div>
  );
}

function StatusLine({ status, error }: { status: "idle" | "saving" | "saved" | "error"; error: string }) {
  if (status === "saving") return <p className="font-mono text-xs text-ink-soft">Saving…</p>;
  if (status === "saved") return <p className="font-mono text-xs text-clay">Saved</p>;
  if (status === "error") return <p className="font-mono text-xs text-clay">[ {error} ]</p>;
  return null;
}

function ModeSection({ mode, onChange }: { mode: PaymentMode; onChange: (mode: PaymentMode) => void }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleChange(next: PaymentMode) {
    setStatus("saving");
    setError("");
    try {
      await setPaymentMode(next);
      onChange(next);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not change mode");
    }
  }

  return (
    <div className={sectionClass}>
      <h2 className="font-display text-lg uppercase text-ink">Payment Mode</h2>
      <p className="mt-1 text-xs text-ink-soft">
        DEMO: customers simulate payments, nothing is charged. LIVE: real gateways are used
        (requires that gateway&apos;s credentials to be saved below first).
      </p>
      <fieldset className="mt-4 flex gap-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            checked={mode === "DEMO"}
            onChange={() => handleChange("DEMO")}
            className="accent-ink"
          />
          DEMO
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="radio"
            checked={mode === "LIVE"}
            onChange={() => handleChange("LIVE")}
            className="accent-ink"
          />
          LIVE
        </label>
      </fieldset>
      <div className="mt-2">
        <StatusLine status={status} error={error} />
      </div>
    </div>
  );
}

function EnabledToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-ink"
      />
      Enabled — customers can select this at checkout
    </label>
  );
}

function BankTransferSection({
  provider,
  onSaved,
}: {
  provider: PaymentProviderAdmin;
  onSaved: (p: PaymentProviderAdmin) => void;
}) {
  const cfg = (provider.publicConfig ?? {}) as Record<string, string>;
  const [enabled, setEnabled] = useState(provider.enabled);
  const [bankName, setBankName] = useState(cfg.bankName ?? "");
  const [accountTitle, setAccountTitle] = useState(cfg.accountTitle ?? "");
  const [accountNumber, setAccountNumber] = useState(cfg.accountNumber ?? "");
  const [iban, setIban] = useState(cfg.iban ?? "");
  const [branch, setBranch] = useState(cfg.branch ?? "");
  const [instructions, setInstructions] = useState(cfg.instructions ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      const result = await upsertProviderConfig("BANK_TRANSFER", {
        enabled,
        publicConfig: { bankName, accountTitle, accountNumber, iban, branch, instructions },
      });
      onSaved(result as PaymentProviderAdmin);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  return (
    <div className={sectionClass}>
      <h2 className="font-display text-lg uppercase text-ink">Bank Transfer</h2>
      <div className="mt-4 flex flex-col gap-3">
        <EnabledToggle enabled={enabled} onChange={setEnabled} />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Bank Name</span>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Account Title</span>
            <input
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Account Number</span>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>IBAN</span>
            <input value={iban} onChange={(e) => setIban(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Branch</span>
            <input value={branch} onChange={(e) => setBranch(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Payment Instructions (shown to customer)</span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={status === "saving"} className={buttonClass}>
            Save
          </button>
          <StatusLine status={status} error={error} />
        </div>
      </div>
    </div>
  );
}

function JazzCashSection({
  provider,
  onSaved,
}: {
  provider: PaymentProviderAdmin;
  onSaved: (p: PaymentProviderAdmin) => void;
}) {
  const cfg = (provider.publicConfig ?? {}) as Record<string, string>;
  const [enabled, setEnabled] = useState(provider.enabled);
  const [merchantId, setMerchantId] = useState(cfg.merchantId ?? "");
  const [hostedCheckoutUrl, setHostedCheckoutUrl] = useState(cfg.hostedCheckoutUrl ?? "");
  const [returnUrl, setReturnUrl] = useState(cfg.returnUrl ?? "");
  const [password, setPassword] = useState("");
  const [integritySalt, setIntegritySalt] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      const secretConfig: Record<string, string> = {};
      if (password) secretConfig.password = password;
      if (integritySalt) secretConfig.integritySalt = integritySalt;

      const result = await upsertProviderConfig("JAZZCASH", {
        enabled,
        publicConfig: { merchantId, hostedCheckoutUrl, returnUrl },
        ...(Object.keys(secretConfig).length ? { secretConfig } : {}),
      });
      onSaved(result as PaymentProviderAdmin);
      setPassword("");
      setIntegritySalt("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  return (
    <div className={sectionClass}>
      <h2 className="font-display text-lg uppercase text-ink">JazzCash</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Get these from the JazzCash merchant portal after sandbox/production onboarding. Also
        used for &quot;Debit/Credit Card&quot; if you pick JazzCash as the card provider below.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <EnabledToggle enabled={enabled} onChange={setEnabled} />
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Merchant ID</span>
          <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Hosted Checkout URL</span>
          <input
            value={hostedCheckoutUrl}
            onChange={(e) => setHostedCheckoutUrl(e.target.value)}
            placeholder="From the JazzCash merchant portal"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Return/Callback URL (optional override)</span>
          <input
            value={returnUrl}
            onChange={(e) => setReturnUrl(e.target.value)}
            placeholder="Defaults to this site's own callback URL if left blank"
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Password {provider.hasSecretConfigured && "(configured — leave blank to keep)"}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Integrity Salt {provider.hasSecretConfigured && "(configured — leave blank to keep)"}
            </span>
            <input
              type="password"
              value={integritySalt}
              onChange={(e) => setIntegritySalt(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={status === "saving"} className={buttonClass}>
            Save
          </button>
          <StatusLine status={status} error={error} />
        </div>
      </div>
    </div>
  );
}

function EasypaisaSection({
  provider,
  onSaved,
}: {
  provider: PaymentProviderAdmin;
  onSaved: (p: PaymentProviderAdmin) => void;
}) {
  const cfg = (provider.publicConfig ?? {}) as Record<string, string>;
  const [enabled, setEnabled] = useState(provider.enabled);
  const [storeId, setStoreId] = useState(cfg.storeId ?? "");
  const [returnUrl, setReturnUrl] = useState(cfg.returnUrl ?? "");
  const [hashKey, setHashKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      const secretConfig: Record<string, string> = {};
      if (hashKey) secretConfig.hashKey = hashKey;

      const result = await upsertProviderConfig("EASYPAISA", {
        enabled,
        publicConfig: { storeId, returnUrl },
        ...(Object.keys(secretConfig).length ? { secretConfig } : {}),
      });
      onSaved(result as PaymentProviderAdmin);
      setHashKey("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  return (
    <div className={sectionClass}>
      <h2 className="font-display text-lg uppercase text-ink">Easypaisa</h2>
      <p className="mt-1 text-xs text-ink-soft">
        Get these from Easypaisa after merchant approval. Note: even fully configured here,
        Easypaisa transactions aren&apos;t live yet — that integration is still pending Easypaisa
        publishing their merchant API spec.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <EnabledToggle enabled={enabled} onChange={setEnabled} />
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Merchant/Store ID</span>
          <input value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Return/Callback URL (optional override)</span>
          <input
            value={returnUrl}
            onChange={(e) => setReturnUrl(e.target.value)}
            placeholder="Defaults to this site's own callback URL if left blank"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            Hash Key {provider.hasSecretConfigured && "(configured — leave blank to keep)"}
          </span>
          <input type="password" value={hashKey} onChange={(e) => setHashKey(e.target.value)} className={inputClass} />
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={status === "saving"} className={buttonClass}>
            Save
          </button>
          <StatusLine status={status} error={error} />
        </div>
      </div>
    </div>
  );
}

function CardSection({
  provider,
  onSaved,
}: {
  provider: PaymentProviderAdmin;
  onSaved: (p: PaymentProviderAdmin) => void;
}) {
  const cfg = (provider.publicConfig ?? {}) as Record<string, string>;
  const [enabled, setEnabled] = useState(provider.enabled);
  const [cardProvider, setCardProvider] = useState(cfg.provider ?? "jazzcash");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      const secretConfig: Record<string, string> = {};
      if (secretKey) secretConfig.secretKey = secretKey;
      if (webhookSecret) secretConfig.webhookSecret = webhookSecret;

      const result = await upsertProviderConfig("CARD", {
        enabled,
        publicConfig: { provider: cardProvider },
        ...(Object.keys(secretConfig).length ? { secretConfig } : {}),
      });
      onSaved(result as PaymentProviderAdmin);
      setSecretKey("");
      setWebhookSecret("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "Could not save");
    }
  }

  return (
    <div className={sectionClass}>
      <h2 className="font-display text-lg uppercase text-ink">Debit/Credit Card</h2>
      <p className="mt-1 text-xs text-ink-soft">
        &quot;JazzCash&quot; reuses the JazzCash credentials above (their hosted page accepts
        cards too) — no extra setup needed. &quot;Stripe&quot; is a separate account, useful for
        testing since it&apos;s free and self-serve, but can&apos;t pay out to a Pakistani bank
        account.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <EnabledToggle enabled={enabled} onChange={setEnabled} />
        <fieldset className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              checked={cardProvider === "jazzcash"}
              onChange={() => setCardProvider("jazzcash")}
              className="accent-ink"
            />
            JazzCash
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              checked={cardProvider === "stripe"}
              onChange={() => setCardProvider("stripe")}
              className="accent-ink"
            />
            Stripe
          </label>
        </fieldset>
        {cardProvider === "stripe" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>
                Secret Key {provider.hasSecretConfigured && "(configured — leave blank to keep)"}
              </span>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_..."
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>
                Webhook Secret {provider.hasSecretConfigured && "(configured — leave blank to keep)"}
              </span>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_..."
                className={inputClass}
              />
            </label>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={status === "saving"} className={buttonClass}>
            Save
          </button>
          <StatusLine status={status} error={error} />
        </div>
      </div>
    </div>
  );
}
