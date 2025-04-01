import {
  encrypt,
  decrypt,
  intToBuffer,
  bufferToInt,
} from './encryptionUtils.js';

class EmailVerificationCodeRepository {
  constructor({ redisAdapter, transactionBuilder }) {
    this.redisAdapter = redisAdapter;
    this.transactionBuilder = transactionBuilder;
  }

  async set({ emailVerificationCode, userId, ttl }) {
    const buffer = intToBuffer(emailVerificationCode);
    const encryptedEmailVerificationCode = encrypt(buffer);
    if (this.transactionBuilder) {
      this.transactionBuilder.addSetWithExpiry(
        `emailVerificationCode:user:${userId}`,
        encryptedEmailVerificationCode,
        ttl
      );
    } else {
      await this.redisAdapter.setWithExpiry(
        `emailVerificationCode:user:${userId}`,
        encryptedEmailVerificationCode,
        ttl
      );
    }
  }

  async delete({ userId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addDel(`emailVerificationCode:user:${userId}`);
    } else {
      await this.redisAdapter.delete(`emailVerificationCode:user:${userId}`);
    }
  }

  async get({ userId }) {
    const encryptedEmailVerificationCode = await this.redisAdapter.get(
      `emailVerificationCode:user:${userId}`
    );
    if (encryptedEmailVerificationCode === null) {
      return null;
    }
    const decryptedEmailVerificationCode = decrypt(
      encryptedEmailVerificationCode
    );
    return bufferToInt(decryptedEmailVerificationCode);
  }
}

export { EmailVerificationCodeRepository };
