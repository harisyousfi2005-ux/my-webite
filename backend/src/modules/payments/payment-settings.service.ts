import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod, PaymentMode, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret } from '../../common/utils/encryption.util';

const SETTINGS_ID = 'singleton';

// CASH_ON_DELIVERY and CARD_ON_DELIVERY have no gateway to configure.
const CONFIGURABLE_PROVIDERS: PaymentMethod[] = [
  'CARD',
  'JAZZCASH',
  'EASYPAISA',
  'BANK_TRANSFER',
];

export interface ProviderConfigInput {
  enabled?: boolean;
  publicConfig?: Record<string, unknown>;
  /** Pass an empty object ({}) to clear a previously-saved secret. */
  secretConfig?: Record<string, unknown>;
}

@Injectable()
export class PaymentSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getMode(): Promise<PaymentMode> {
    return (await this.getOrCreateSettings()).mode;
  }

  async setMode(adminId: string, mode: PaymentMode) {
    if (mode === 'LIVE' && !(await this.hasAnyLiveReadyGateway())) {
      throw new BadRequestException(
        'Cannot switch to LIVE mode: no enabled gateway payment method (Card, JazzCash, ' +
          'or Easypaisa) has its required credentials configured yet.',
      );
    }
    await this.getOrCreateSettings();
    return this.prisma.paymentSettings.update({
      where: { id: SETTINGS_ID },
      data: { mode, updatedByAdminId: adminId },
    });
  }

  /** For checkout — mode plus which methods are enabled and their non-secret config. */
  async getPublicSettings() {
    const [settings, configs] = await Promise.all([
      this.getOrCreateSettings(),
      this.prisma.paymentProviderConfig.findMany({
        where: { provider: { in: CONFIGURABLE_PROVIDERS } },
      }),
    ]);
    return {
      mode: settings.mode,
      providers: CONFIGURABLE_PROVIDERS.map((provider) => {
        const cfg = configs.find((c) => c.provider === provider);
        return {
          provider,
          // A provider nobody has touched yet defaults to enabled, so the
          // site is fully demoable out of the box — the client can disable
          // methods she doesn't want to offer once she's ready.
          enabled: cfg?.enabled ?? true,
          publicConfig: cfg?.publicConfig ?? null,
        };
      }),
    };
  }

  /** For Admin -> Payment Settings — never includes the actual secret, only whether one is set. */
  async getAdminSettings() {
    const [settings, configs] = await Promise.all([
      this.getOrCreateSettings(),
      this.prisma.paymentProviderConfig.findMany({
        where: { provider: { in: CONFIGURABLE_PROVIDERS } },
      }),
    ]);
    return {
      mode: settings.mode,
      providers: CONFIGURABLE_PROVIDERS.map((provider) => {
        const cfg = configs.find((c) => c.provider === provider);
        return {
          provider,
          enabled: cfg?.enabled ?? true,
          publicConfig: cfg?.publicConfig ?? null,
          hasSecretConfigured: Boolean(cfg?.secretConfig),
          updatedAt: cfg?.updatedAt ?? null,
        };
      }),
    };
  }

  async upsertProviderConfig(
    adminId: string,
    provider: PaymentMethod,
    input: ProviderConfigInput,
  ) {
    if (!CONFIGURABLE_PROVIDERS.includes(provider)) {
      throw new BadRequestException(`${provider} is not a configurable payment provider`);
    }

    let secretConfig: string | null | undefined;
    if (input.secretConfig !== undefined) {
      secretConfig = Object.keys(input.secretConfig).length
        ? encryptSecret(JSON.stringify(input.secretConfig))
        : null;
    }

    const updated = await this.prisma.paymentProviderConfig.upsert({
      where: { provider },
      create: {
        provider,
        // Matches the "unconfigured = enabled" default read elsewhere — an
        // admin saving publicConfig without touching `enabled` shouldn't
        // silently disable the method.
        enabled: input.enabled ?? true,
        publicConfig: (input.publicConfig ?? {}) as Prisma.InputJsonValue,
        secretConfig: secretConfig ?? null,
        updatedByAdminId: adminId,
      },
      update: {
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.publicConfig !== undefined
          ? { publicConfig: input.publicConfig as Prisma.InputJsonValue }
          : {}),
        ...(secretConfig !== undefined ? { secretConfig } : {}),
        updatedByAdminId: adminId,
      },
    });

    return {
      provider: updated.provider,
      enabled: updated.enabled,
      publicConfig: updated.publicConfig,
      hasSecretConfigured: Boolean(updated.secretConfig),
      updatedAt: updated.updatedAt,
    };
  }

  /** Server-side only — decrypts a provider's secret config to actually call the gateway. */
  async getDecryptedSecretConfig<T = Record<string, string>>(
    provider: PaymentMethod,
  ): Promise<T | null> {
    const cfg = await this.prisma.paymentProviderConfig.findUnique({
      where: { provider },
    });
    if (!cfg?.secretConfig) return null;
    return JSON.parse(decryptSecret(cfg.secretConfig)) as T;
  }

  async getProviderConfig(provider: PaymentMethod) {
    return this.prisma.paymentProviderConfig.findUnique({ where: { provider } });
  }

  /** Same "unconfigured = enabled" default as getPublicSettings/getAdminSettings. */
  async isEnabled(provider: PaymentMethod): Promise<boolean> {
    const cfg = await this.getProviderConfig(provider);
    return cfg?.enabled ?? true;
  }

  callbackUrl(providerPath: string): string {
    return `${this.config.get<string>('backendPublicUrl')}/payments/${providerPath}/callback`;
  }

  frontendResultUrl(orderId?: string): string {
    const url = `${this.config.get<string>('corsOrigin')}/checkout/payment-result`;
    return orderId ? `${url}?orderId=${orderId}` : url;
  }

  frontendCheckoutUrl(): string {
    return `${this.config.get<string>('corsOrigin')}/checkout`;
  }

  private async hasAnyLiveReadyGateway(): Promise<boolean> {
    const configs = await this.prisma.paymentProviderConfig.findMany({
      where: { provider: { in: ['CARD', 'JAZZCASH', 'EASYPAISA'] }, enabled: true },
    });
    return configs.some((c) => Boolean(c.secretConfig));
  }

  private async getOrCreateSettings() {
    return this.prisma.paymentSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
  }
}
