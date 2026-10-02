const KNOWN_DEFAULTS = ['dev-secret-change-in-production'];
const MIN_LENGTH = 32;

/** The token signing secret. There is no fallback: the API refuses to start without a real one. */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_LENGTH || KNOWN_DEFAULTS.includes(secret)) {
    throw new Error(
      `JWT_SECRET must be set to a private random value of at least ${MIN_LENGTH} characters ` +
        `(generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")`,
    );
  }
  return secret;
}
