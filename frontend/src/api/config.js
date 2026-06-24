function requireEnv(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`${name} must be set in .env`);
  }
  return value;
}

export const USER_API = requireEnv("VITE_USER_API");
export const REPAIR_API = requireEnv("VITE_REPAIR_API");
export const PRODUCT_API = requireEnv("VITE_PRODUCT_API");
export const ORDER_API = requireEnv("VITE_ORDER_API");
export const PAYMENT_API = requireEnv("VITE_PAYMENT_API");
