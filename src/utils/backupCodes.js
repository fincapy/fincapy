import crypto from 'crypto';

/**
 * Generates a set of backup codes for TOTP recovery
 * @param {number} count Number of backup codes to generate
 * @param {number} length Length of each backup code
 * @returns {Object} Object containing plaintext codes and their hashed versions
 */
export function generateBackupCodes(count = 10, length = 8) {
  const codes = [];
  const hashedCodes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random alphanumeric code
    const code = crypto.randomBytes(length)
      .toString('hex')
      .slice(0, length)
      .toUpperCase();
    
    // Create a salted hash of the code
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(code, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    codes.push(code);
    hashedCodes.push({ hash, salt, used: false });
  }
  
  return { codes, hashedCodes };
}

/**
 * Verifies a backup code against stored hashed codes
 * @param {string} code The backup code to verify
 * @param {Array} hashedCodes Array of hashed codes with their salts
 * @returns {number} Index of the matched code or -1 if no match
 */
export function verifyBackupCode(code, hashedCodes) {
  if (!code || !hashedCodes || !Array.isArray(hashedCodes)) {
    return -1;
  }
  
  const normalizedCode = code.trim().toUpperCase();
  
  for (let i = 0; i < hashedCodes.length; i++) {
    const { hash, salt, used } = hashedCodes[i];
    
    // Skip already used codes
    if (used) continue;
    
    const hashCheck = crypto
      .pbkdf2Sync(normalizedCode, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    if (hash === hashCheck) {
      return i; // Return index of matched code
    }
  }
  
  return -1; // No match found
}
