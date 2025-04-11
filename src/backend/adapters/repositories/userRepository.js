import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { encrypt, decrypt, hashEmail } from './encryptionUtils.js';
import { User } from '../../domain/user.js';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

class UserRepository {
  constructor({ redisAdapter, transactionBuilder }) {
    this.transactionBuilder = transactionBuilder;
    this.redisAdapter = redisAdapter;
  }

  async getByEmail({ email }) {
    const emailHash = hashEmail(email);
    const userId = await this.redisAdapter.get(`email:user:${emailHash}`);
    if (userId === null) {
      return null;
    }
    const user = await this.get({ userId });
    if (!user) {
      throw new Error('Unlinked email');
    }
    return user;
  }

  async setEmailLookup({ email, userId }) {
    const emailHash = hashEmail(email);
    if (this.transactionBuilder) {
      this.transactionBuilder.addSet(`email:user:${emailHash}`, userId);
    } else {
      await this.redisAdapter.set(`email:user:${emailHash}`, userId);
    }
  }

  async deleteEmailLookup({ email }) {
    const emailHash = hashEmail(email);
    if (this.transactionBuilder) {
      this.transactionBuilder.addDel(`email:user:${emailHash}`);
    } else {
      await this.redisAdapter.delete(`email:user:${emailHash}`);
    }
  }

  async incrementVersion({ userId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addIncr(`version:user:${userId}`);
    } else {
      await this.redisAdapter.incr(`version:user:${userId}`);
    }
  }

  async get({ userId }) {
    // hash email for use as key
    const userObject = await this.redisAdapter.get(`user:${userId}`);
    if (userObject === null) {
      return null;
    }
    if (this.transactionBuilder) {
      const version = await this.redisAdapter.get(`version:user:${userId}`);
      this.transactionBuilder.watchVersion(`version:user:${userId}`, version);
    }
    const decryptedUser = decrypt(userObject);
    const decompressedUser = await brotliDecompress(decryptedUser);
    const packr = new Packr();
    const unpackedUser = packr.unpack(decompressedUser);
    return new User(unpackedUser);
  }

  async set({ userId, user }) {
    const packr = new Packr();
    const packedUser = packr.pack(user);
    const compressedUser = await brotliCompress(packedUser);
    const encryptedUser = encrypt(compressedUser);
    if (this.transactionBuilder) {
      this.transactionBuilder.addSet(`user:${userId}`, encryptedUser);
    } else {
      await this.redisAdapter.set(`user:${userId}`, encryptedUser);
    }
  }

  async delete({ userId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addDel(`user:${userId}`);
    } else {
      await this.redisAdapter.delete(`user:${userId}`);
    }
  }
}

export { UserRepository };
