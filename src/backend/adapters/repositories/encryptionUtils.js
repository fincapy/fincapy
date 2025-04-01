import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Finds the most recent encryption key from environment variables
 * @returns {Buffer} - The most recent encryption key
 */
function findLatestEncryptionKey() {
  // Find all encryption keys in process.env
  const envKeys = Object.keys(process.env);
  const encryptionKeys = envKeys.filter(
    (key) => key === 'ENCRYPTION_KEY' || key.match(/^ENCRYPTION_KEY_\d+$/)
  );

  if (encryptionKeys.length === 0) {
    throw new Error('No encryption key found in environment variables');
  }

  // Sort keys to find the most recent one
  // ENCRYPTION_KEY is considered older than any ENCRYPTION_KEY_N
  encryptionKeys.sort((a, b) => {
    // Plain ENCRYPTION_KEY should always be considered oldest
    if (a === 'ENCRYPTION_KEY') return 1; // Move a to the end
    if (b === 'ENCRYPTION_KEY') return -1; // Move b to the end

    // For numbered keys, higher number is more recent
    const numA = parseInt(a.split('_').pop(), 10);
    const numB = parseInt(b.split('_').pop(), 10);
    return numB - numA; // Higher number comes first
  });

  const latestKeyName = encryptionKeys[0];
  return Buffer.from(process.env[latestKeyName], 'base64');
}

const KEY = findLatestEncryptionKey();

/**
 * Encrypts data using AES-256-GCM
 * @param {Buffer} data - Data to encrypt
 * @returns {Buffer} - Encrypted data with IV and auth tag prepended
 */
function encrypt(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypts data using AES-256-GCM
 * @param {Buffer} encryptedData - Encrypted data with IV and auth tag prepended
 * @returns {Buffer} - Decrypted data
 */
function decrypt(encryptedData) {
  const iv = encryptedData.slice(0, IV_LENGTH);
  const authTag = encryptedData.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = encryptedData.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

/**
 * Encrypts a string and returns it as a base64 string (for waitlist)
 * @param {string} data - String to encrypt
 * @returns {string} - Base64 encoded encrypted data
 */
function encryptToBase64(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypts a base64 encoded string (for waitlist)
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} - Decrypted string
 */
function decryptFromBase64(encryptedData) {
  const dataBuffer = Buffer.from(encryptedData, 'base64');
  const iv = dataBuffer.slice(0, IV_LENGTH);
  const authTag = dataBuffer.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = dataBuffer.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Converts an integer to a buffer (for email verification codes)
 * @param {number} num - Integer to convert
 * @returns {Buffer} - Buffer representation
 */
function intToBuffer(num) {
  const buffer = Buffer.alloc(3); // 3 bytes are enough for a 6-digit number
  buffer.writeUIntBE(num, 0, 3); // Big-endian, 3 bytes
  return buffer;
}

/**
 * Converts a buffer to an integer (for email verification codes)
 * @param {Buffer} buffer - Buffer to convert
 * @returns {number} - Integer representation
 */
function bufferToInt(buffer) {
  return buffer.readUIntBE(0, 3); // Read as big-endian 3-byte integer
}

/**
 * Hashes an email address for storage
 * @param {string} email - Email to hash
 * @returns {string} - Hex encoded hash
 */
function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');
}

/**
 * Hashes a session ID for storage
 * @param {string} sessionId - Session ID to hash
 * @returns {string} - Hex encoded hash
 */
function hashSessionId(sessionId) {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

export {
  encrypt,
  decrypt,
  encryptToBase64,
  decryptFromBase64,
  intToBuffer,
  bufferToInt,
  hashEmail,
  hashSessionId,
  ALGORITHM,
  KEY,
  IV_LENGTH,
  findLatestEncryptionKey,
};
