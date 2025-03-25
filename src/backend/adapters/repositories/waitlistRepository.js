import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
const IV_LENGTH = 12;

function encrypt(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decrypt(encryptedData) {
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

class WaitlistRepository {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async addToWaitlist({ email }) {
    const waitlistKey = 'waitlist';
    const encryptedEmail = encrypt(email);
    await this.redisAdapter.lpush(waitlistKey, encryptedEmail);
  }

  async getWaitlist() {
    const waitlistKey = 'waitlist';
    const waitlistData = await this.redisAdapter.lrange(waitlistKey, 0, -1);
    const emails = [];

    for (const encryptedEmail of waitlistData) {
      try {
        const email = decrypt(encryptedEmail);
        emails.push(email);
      } catch (error) {
        console.error('Error decrypting email:', error);
      }
    }

    return emails;
  }
}

export { WaitlistRepository };
