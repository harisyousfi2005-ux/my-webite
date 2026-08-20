import { Injectable, ServiceUnavailableException } from '@nestjs/common';

/**
 * Easypaisa Online Payment Gateway — SCAFFOLD ONLY.
 *
 * Unlike JazzCash, Easypaisa's direct merchant API specification (exact
 * request/response field names, hash/signature algorithm, endpoint URLs) is
 * not published anywhere publicly — Easypaisa hands it to merchants only
 * after an approval process via their merchant portal. Rather than guess at
 * field names (and risk building something that looks like it works but
 * silently doesn't, or worse, misrepresents a payment's real status), this
 * service is left as a clearly-marked stub until that documentation exists.
 *
 * To complete this integration once you have Easypaisa's merchant docs,
 * mirror the pattern in jazzcash.service.ts:
 *   1. A `buildCheckoutRequest()` method that takes credentials sourced from
 *      Admin -> Payment Settings -> Easypaisa (store ID + secret credentials
 *      + return URL, via PaymentSettingsService) and returns either a
 *      redirect (actionUrl + form fields) or an API call result, using the
 *      exact field names from Easypaisa's docs.
 *   2. A `verifyCallback()` method that recomputes Easypaisa's signature
 *      server-side and compares it to the received one before ever trusting
 *      a "success" result — never trust the value alone.
 */
@Injectable()
export class EasypaisaService {
  buildCheckoutRequest(
    _credentials: Record<string, string>,
    _order: { orderNumber: string; amount: number },
  ): never {
    throw new ServiceUnavailableException(
      'Easypaisa payments are not yet available — this integration is pending ' +
        "Easypaisa's merchant API documentation. Please choose another payment method.",
    );
  }

  verifyCallback(
    _payload: Record<string, string>,
    _credentials: Record<string, string>,
  ): never {
    throw new ServiceUnavailableException('Easypaisa integration is not yet configured.');
  }
}
