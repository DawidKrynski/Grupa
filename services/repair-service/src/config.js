const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function requireEnv(name) {
  const value = typeof process.env[name] === "string" ? process.env[name].trim() : "";
  if (!value) {
    throw new Error(`${name} must be set in .env`);
  }
  return value;
}

module.exports = {
  JWT_SECRET: requireEnv("JWT_SECRET"),
  requireEnv
};
