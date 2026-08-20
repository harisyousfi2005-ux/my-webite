import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/** Derives a 32-byte AES key from the (any-length) env secret. */
function getKey(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'SETTINGS_ENCRYPTION_KEY is not set — required to store/read encrypted payment credentials',
    );
  }
  return crypto.createHash('sha256').update(secret).digest();
}

/** Encrypts a string for storage (e.g. as PaymentProviderConfig.secretConfig). */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(
    ':',
  );
}

/** Reverses encryptSecret. Only call this server-side when actually using a credential. */
export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}
