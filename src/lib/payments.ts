import { apiFetch } from "@/lib/api";
import { unwrapEnvelope, type ApiEnvelope } from "@/lib/apiError";
import type {
  BankDetails,
  InitiatePaymentResult,
  Payment,
  PaymentMethod,
  PaymentMode,
  PaymentSettingsAdmin,
  PaymentSettingsPublic,
} from "@/types";

export function getBankDetails(): Promise<BankDetails> {
  return apiFetch<BankDetails>("/payments/bank-details");
}

export function initiatePayment(orderId: string): Promise<InitiatePaymentResult> {
  return apiFetch<InitiatePaymentResult>(`/payments/${orderId}/initiate`, {
    method: "POST",
  });
}

export function simulateDemoPayment(
  orderId: string,
  outcome: "success" | "failure",
): Promise<{ orderId: string; status: string }> {
  return apiFetch(`/payments/${orderId}/demo/simulate`, {
    method: "POST",
    body: { outcome },
  });
}

export function getPaymentForOrder(orderId: string): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${orderId}`);
}

// --- Payment settings ---

export function getPaymentSettingsPublic(): Promise<PaymentSettingsPublic> {
  return apiFetch<PaymentSettingsPublic>("/payments/settings/public");
}

export function getPaymentSettingsAdmin(): Promise<PaymentSettingsAdmin> {
  return apiFetch<PaymentSettingsAdmin>("/payments/settings");
}

export function setPaymentMode(mode: PaymentMode): Promise<unknown> {
  return apiFetch("/payments/settings/mode", { method: "PATCH", body: { mode } });
}

export function upsertProviderConfig(
  provider: PaymentMethod,
  input: {
    enabled?: boolean;
    publicConfig?: Record<string, unknown>;
    secretConfig?: Record<string, unknown>;
  },
): Promise<unknown> {
  return apiFetch(`/payments/settings/${provider}`, { method: "PATCH", body: input });
}

/**
 * Uses a plain `fetch` (not `apiFetch`) because this sends a FormData body
 * for the optional proof image — the browser needs to set its own
 * multipart Content-Type header with the correct boundary, which JSON.stringify
 * would break.
 */
export async function submitBankTransferProof(
  orderId: string,
  formData: FormData,
): Promise<Payment> {
  const res = await fetch(`/api/backend/payments/${orderId}/bank-transfer/proof`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const json = (await res.json()) as ApiEnvelope<Payment>;
  return unwrapEnvelope(json);
}
