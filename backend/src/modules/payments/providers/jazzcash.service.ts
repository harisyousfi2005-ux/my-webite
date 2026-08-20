import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface JazzCashCredentials {
  merchantId: string;
  password: string;
  integritySalt: string;
  hostedCheckoutUrl: string;
  returnUrl: string;
}

export interface JazzCashHostedCheckoutRequest {
  actionUrl: string;
  txnRefNo: string;
  fields: Record<string, string>;
}

export interface JazzCashCallbackResult {
  isSignatureValid: boolean;
  isSuccessful: boolean;
  txnRefNo?: string;
  responseCode?: string;
  responseMessage?: string;
  retrievalReferenceNo?: string;
}

/**
 * JazzCash Hosted Checkout (Type 2: HTTP POST Page Redirection).
 *
 * Field names and the pp_SecureHash algorithm are confirmed from JazzCash's
 * official sandbox documentation (sandbox.jazzcash.com.pk/SandboxDocumentation)
 * plus cross-checked against a real open-source reference implementation's
 * source. What is NOT publicly documented — the actual sandbox/production
 * endpoint URL — is admin-configured (Payment Settings -> JazzCash) rather
 * than guessed; get it from the JazzCash merchant portal after sandbox
 * onboarding and verify the exact field list still matches at that point.
 *
 * Pure credential-in, request-out service — it doesn't know or care where
 * the credentials came from (PaymentSettingsService sources them from the
 * database). This same hosted page is used for both "JazzCash" (mobile
 * wallet) and "Card" payment methods — JazzCash's hosted checkout lets the
 * customer pick either on their own page, so our backend never touches
 * card data.
 */
@Injectable()
export class JazzCashService {
  buildHostedCheckoutRequest(
    credentials: JazzCashCredentials,
    order: { orderNumber: string; amount: number },
  ): JazzCashHostedCheckoutRequest {
    const { merchantId, password, integritySalt, hostedCheckoutUrl, returnUrl } =
      credentials;

    const txnRefNo = `T${order.orderNumber.replace(/[^A-Z0-9]/gi, '')}${Date.now()}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const fields: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_Language: 'EN',
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_TxnRefNo: txnRefNo,
      // JazzCash amounts are the currency value with the decimal point
      // removed (i.e. multiplied by 100, no separate decimal fields) — this
      // is the widely-documented convention; verify against your sandbox
      // once you have real test transactions to confirm.
      pp_Amount: String(Math.round(order.amount * 100)),
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime: this.formatDateTime(now),
      pp_TxnExpiryDateTime: this.formatDateTime(expiry),
      pp_BillReference: order.orderNumber,
      pp_Description: `Order ${order.orderNumber}`,
      pp_ReturnURL: returnUrl,
      ppmpf_1: '',
      ppmpf_2: '',
      ppmpf_3: '',
      ppmpf_4: '',
      ppmpf_5: '',
    };

    const pp_SecureHash = this.generateSecureHash(fields, integritySalt);

    return {
      actionUrl: hostedCheckoutUrl,
      txnRefNo,
      fields: { ...fields, pp_SecureHash },
    };
  }

  /** Verifies a callback POSTed by JazzCash to our pp_ReturnURL. */
  verifyCallback(
    payload: Record<string, string>,
    integritySalt: string,
  ): JazzCashCallbackResult {
    const receivedHash = payload.pp_SecureHash;
    if (!integritySalt || !receivedHash) {
      return { isSignatureValid: false, isSuccessful: false };
    }

    const { pp_SecureHash: _ignored, ...rest } = payload;
    const expectedHash = this.generateSecureHash(rest, integritySalt);

    const isSignatureValid = this.timingSafeEqual(expectedHash, receivedHash);

    return {
      isSignatureValid,
      isSuccessful: isSignatureValid && payload.pp_ResponseCode === '000',
      txnRefNo: payload.pp_TxnRefNo,
      responseCode: payload.pp_ResponseCode,
      responseMessage: payload.pp_ResponseMessage,
      retrievalReferenceNo: payload.pp_RetreivalReferenceNo,
    };
  }

  /**
   * pp_SecureHash algorithm: sort field names alphabetically, join non-empty
   * values with '&', prepend the integrity salt, then HMAC-SHA256 the whole
   * string using the salt as the key. Confirmed against a real reference
   * implementation of JazzCash's documented hashing scheme.
   */
  private generateSecureHash(fields: Record<string, string>, salt: string): string {
    const sortedKeys = Object.keys(fields).sort();
    let message = salt;
    for (const key of sortedKeys) {
      const value = fields[key];
      if (value !== undefined && value !== null && value !== '') {
        message += `&${value}`;
      }
    }
    return crypto.createHmac('sha256', salt).update(message).digest('hex');
  }

  private timingSafeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  private formatDateTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
      `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
    );
  }
}
