import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { encrypt, decrypt } from './encryptionUtils.js';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

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
