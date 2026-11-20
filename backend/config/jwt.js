// The JWT secret signs every login token. A known or short secret lets anyone
// create a valid admin token, so the server must not start without a strong one.
const MIN_LENGTH = 32;
const KNOWN_PLACEHOLDERS = new Set([
  'your-secret-key',
  'your-secret-key-change-this-in-production',
]);

let cached;

function getJwtSecret() {
  if (cached) return cached;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Generate one with: openssl rand -hex 32');
  }
  if (KNOWN_PLACEHOLDERS.has(secret)) {
    throw new Error('JWT_SECRET is a published placeholder value. Generate a new one with: openssl rand -hex 32');
  }
  if (secret.length < MIN_LENGTH) {
    throw new Error(`JWT_SECRET is too short (minimum ${MIN_LENGTH} characters). Generate one with: openssl rand -hex 32`);
  }
  cached = secret;
  return cached;
}

module.exports = { getJwtSecret };
