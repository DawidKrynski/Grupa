const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DEV_JWT_SECRET = "veloshop-secret";
const JWT_ENV_FILES = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../user-service/.env")
];

function readJwtSecret(envPath) {
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath));
  return typeof parsed.JWT_SECRET === "string" && parsed.JWT_SECRET.trim()
    ? parsed.JWT_SECRET.trim()
    : null;
}

function resolveJwtSecret() {
  const configuredSecret = typeof process.env.JWT_SECRET === "string"
    ? process.env.JWT_SECRET.trim()
    : "";

  if (configuredSecret) {
    return configuredSecret;
  }

  for (const envPath of JWT_ENV_FILES) {
    const jwtSecret = readJwtSecret(envPath);
    if (jwtSecret) {
      return jwtSecret;
    }
  }

  const nodeEnv = process.env.NODE_ENV || "development";
  if (nodeEnv === "development") {
    console.warn("JWT_SECRET is not set. Using development-only fallback.");
    return DEV_JWT_SECRET;
  }

  throw new Error("JWT_SECRET must be set outside development.");
}

module.exports = {
  JWT_SECRET: resolveJwtSecret()
};
