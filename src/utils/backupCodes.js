import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generates a set of backup codes for TOTP recovery
 * @param {number} count Number of backup codes to generate
 * @param {number} length Length of each backup code
 * @returns {Object} Object containing plaintext codes and their hashed versions
 */
export async function generateBackupCodes(count = 5, length = 16) {
  const codes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    // Generate random alphanumeric code
    const code = crypto.randomBytes(length).toString('hex').slice(0, length);

    codes.push(code);
    const hashedCode = await bcrypt.hash(code, 12);
    hashedCodes.push({ hashedCode, used: false });
  }

  return { codes, hashedCodes };
}

/**
 * Verifies a backup code against stored hashed codes
 * @param {string} code The backup code to verify
 * @param {Array} hashedCodes Array of hashed codes with their salts
 * @returns {number} Index of the matched code or -1 if no match
 */
export async function verifyBackupCode(code, hashedCodes) {
  let matchFoundIndex = -1;
  for (let i = 0; i < hashedCodes.length; i++) {
    const { hashedCode, used } = hashedCodes[i];

    const valid = await bcrypt.compare(code, hashedCode);
    if (valid && matchFoundIndex === -1 && !used) {
      matchFoundIndex = i;
    }
  }

  return matchFoundIndex;
}
