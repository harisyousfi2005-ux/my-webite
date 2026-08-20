import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(4000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().optional(),
  ADMIN_NAME: Joi.string().optional(),

  // Payment provider credentials (JazzCash/Easypaisa/card gateway) are no
  // longer env vars — they're admin-configurable at runtime via
  // PaymentProviderConfig (see modules/payments/payment-settings.service.ts),
  // encrypted at rest with this key. Only deployment-level, non-secret
  // payment config stays as env vars.
  SETTINGS_ENCRYPTION_KEY: Joi.string().min(16).required(),
  BACKEND_PUBLIC_URL: Joi.string().default('http://localhost:4000/api/v1'),

  // Optional SMTP credentials for order-confirmation emails. Left unset
  // during development/demo — EmailService falls back to a disposable
  // Ethereal test inbox so the flow still works end-to-end.
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().optional(),
  SMTP_SECURE: Joi.string().valid('true', 'false').optional(),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASSWORD: Joi.string().optional(),
  SMTP_FROM: Joi.string().optional(),
});
