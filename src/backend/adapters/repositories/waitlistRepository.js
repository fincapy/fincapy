import { encryptToBase64, decryptFromBase64 } from './encryptionUtils.js';

class WaitlistRepository {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async addToWaitlist({ email }) {
    const waitlistKey = 'waitlist';
    const encryptedEmail = encryptToBase64(email);
    await this.redisAdapter.lpush(waitlistKey, encryptedEmail);
  }

  async getWaitlist() {
    const waitlistKey = 'waitlist';
    const waitlistData = await this.redisAdapter.lrange(waitlistKey, 0, -1);
    const emails = [];

    for (const encryptedEmail of waitlistData) {
      try {
        const email = decryptFromBase64(encryptedEmail);
        emails.push(email);
      } catch (error) {
        console.error('Error decrypting email:', error);
      }
    }

    return emails;
  }
}

export { WaitlistRepository };
