export function validateProductionConfig(env = process.env) {
  const errors = [];
  const isProduction = env.NODE_ENV === "production";
  if (isProduction && (!env.CORS_ORIGIN || env.CORS_ORIGIN === "*")) errors.push("CORS_ORIGIN must be an explicit HTTPS origin in production.");
  if (isProduction && !env.ADMIN_PASSWORD_HASH) errors.push("ADMIN_PASSWORD_HASH must be configured in production.");
  if (isProduction && !env.DATABASE_URL) errors.push("DATABASE_URL must be configured when using the production SQL adapter.");
  if (isProduction && env.CORS_ORIGIN && !env.CORS_ORIGIN.startsWith("https://")) errors.push("CORS_ORIGIN must use HTTPS in production.");
  return errors;
}
