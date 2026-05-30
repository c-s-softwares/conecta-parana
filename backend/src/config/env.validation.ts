import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  CORS_ORIGIN: Joi.string().required(),
  REDIS_URL: Joi.string().uri().default('redis://localhost:6379'),
  GLITCHTIP_DSN: Joi.string().uri().allow('').default(''),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),

  // Oracle Object Storage (ver docs/SETUP.md secao "Object Storage Oracle")
  OCI_OBJECT_STORAGE_NAMESPACE: Joi.string().required(),
  OCI_BUCKET_NAME: Joi.string().required(),
  OCI_REGION: Joi.string().required(),
  OCI_TENANCY_OCID: Joi.string().required(),
  OCI_USER_OCID: Joi.string().required(),
  OCI_FINGERPRINT: Joi.string().required(),
  OCI_PRIVATE_KEY_PATH: Joi.string().required(),
});
