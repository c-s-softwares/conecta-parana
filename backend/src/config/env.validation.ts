import * as Joi from 'joi';

/**
 * Helper: torna uma env obrigatória apenas quando STORAGE_DRIVER=oci.
 * Permite dev rodar sem credenciais OCI configuradas.
 */
const requiredOnlyForOci = (schema: Joi.StringSchema): Joi.StringSchema =>
  schema.when('STORAGE_DRIVER', {
    is: 'oci',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  });

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

  // Driver do storage de arquivos. Em dev, `local` salva em disco
  // (backend/.local-uploads/) e dispensa credenciais Oracle. Em staging/prod,
  // usar `oci` para falar com o Oracle Cloud Object Storage.
  STORAGE_DRIVER: Joi.string().valid('local', 'oci').default('local'),

  // Oracle Object Storage - obrigatórias apenas quando STORAGE_DRIVER=oci.
  // Ver docs/SETUP.md secao "Object Storage Oracle".
  OCI_OBJECT_STORAGE_NAMESPACE: requiredOnlyForOci(Joi.string()),
  OCI_BUCKET_NAME: requiredOnlyForOci(Joi.string()),
  OCI_REGION: requiredOnlyForOci(Joi.string()),
  OCI_TENANCY_OCID: requiredOnlyForOci(Joi.string()),
  OCI_USER_OCID: requiredOnlyForOci(Joi.string()),
  OCI_FINGERPRINT: requiredOnlyForOci(Joi.string()),
  OCI_PRIVATE_KEY_PATH: requiredOnlyForOci(Joi.string()),
});
