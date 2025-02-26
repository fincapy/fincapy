import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'key', 'base64');
const IV_LENGTH = 12;

function encrypt(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

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

class MessageRepository {
  constructor({
    redisAdapter,
    transactionBuilder,
    streamName,
    groupName,
    consumerName,
  }) {
    this.redisAdapter = redisAdapter;
    this.transactionBuilder = transactionBuilder;
    this.streamName = streamName;
    this.groupName = groupName;
    this.consumerName = consumerName;
  }

  async add({ message, messageType }) {
    const packr = new Packr();
    const packedMessage = packr.pack(message);
    const compressedMessage = await brotliCompress(packedMessage);
    const encryptedMessage = encrypt(compressedMessage);
    const base64Message = encryptedMessage.toString('base64');
    if (this.transactionBuilder) {
      console.log('Adding message to transaction');
      this.transactionBuilder.addXAdd(
        this.streamName,
        messageType,
        base64Message
      );
    } else {
      await this.redisAdapter.xadd(this.streamName, messageType, base64Message);
    }
  }

  async getSome({ count, readPending }) {
    const result = await this.redisAdapter.xreadgroup({
      groupName: this.groupName,
      consumerName: this.consumerName,
      count,
      block: readPending ? 500 : 0,
      streamName: this.streamName,
      readPending,
    });
    if (!result) return [];
    const parsedMessages = [];
    for (const [stream, messages] of result) {
      for (const [id, fields] of messages) {
        const encryptedMessage = Buffer.from(fields[3], 'base64');
        const decryptedMessage = decrypt(encryptedMessage);
        const decompressedMessage = await brotliDecompress(decryptedMessage);
        const packr = new Packr();
        const unpackedMessage = packr.unpack(decompressedMessage);
        parsedMessages.push({ messageId: id, message: unpackedMessage });
      }
    }
    return parsedMessages;
  }

  async acknowledge({ messageId }) {
    await this.redisAdapter.xack(this.streamName, this.groupName, messageId);
  }
}

export { MessageRepository };
