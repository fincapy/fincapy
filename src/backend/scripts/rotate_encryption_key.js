#!/usr/bin/env node

import { RedisAdapter, redisClient } from '../adapters/redisAdapter.js';
import crypto from 'crypto';
import { promisify } from 'util';
import zlib from 'zlib';
import { Packr } from 'msgpackr';
import {
  ALGORITHM,
  IV_LENGTH,
  intToBuffer,
  bufferToInt,
  findLatestEncryptionKey,
} from '../adapters/repositories/encryptionUtils.js';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

/**
 * Finds the second most recent encryption key from environment variables
 * @returns {Buffer} - The second most recent encryption key
 */
function findPreviousEncryptionKey() {
  // Find all encryption keys in process.env
  const envKeys = Object.keys(process.env);
  const encryptionKeys = envKeys.filter(
    (key) => key === 'ENCRYPTION_KEY' || key.match(/^ENCRYPTION_KEY_\d+$/)
  );

  if (encryptionKeys.length < 2) {
    throw new Error('At least two encryption keys are required for rotation');
  }

  // Sort keys using the same logic as findLatestEncryptionKey
  encryptionKeys.sort((a, b) => {
    // Plain ENCRYPTION_KEY should always be considered oldest
    if (a === 'ENCRYPTION_KEY') return 1;
    if (b === 'ENCRYPTION_KEY') return -1;

    // For numbered keys, higher number is more recent
    const numA = parseInt(a.split('_').pop(), 10);
    const numB = parseInt(b.split('_').pop(), 10);
    return numB - numA; // Higher number comes first
  });

  // Get the second key (previous key)
  const previousKeyName = encryptionKeys[1];
  console.log('Previous key name:', previousKeyName);
  return Buffer.from(process.env[previousKeyName], 'base64');
}

// Dynamically get the latest and previous keys
const NEW_KEY = findLatestEncryptionKey();
console.log('Using most recent key for NEW_KEY');
const OLD_KEY = findPreviousEncryptionKey();
console.log('Using second most recent key for OLD_KEY');

// Function to decrypt data with the old key
function decryptWithOldKey(encryptedData) {
  const iv = encryptedData.slice(0, IV_LENGTH);
  const authTag = encryptedData.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = encryptedData.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, OLD_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

// Function to encrypt data with the new key
function encryptWithNewKey(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, NEW_KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

// Function to decrypt waitlist data with the old key (Base64 format)
function decryptWaitlistWithOldKey(encryptedData) {
  const dataBuffer = Buffer.from(encryptedData, 'base64');
  const iv = dataBuffer.slice(0, IV_LENGTH);
  const authTag = dataBuffer.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = dataBuffer.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, OLD_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

// Function to encrypt waitlist data with the new key (Base64 format)
function encryptWaitlistWithNewKey(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, NEW_KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

async function rotateEncryptionKeys() {
  console.log('Starting encryption key rotation...');

  const redisAdapter = new RedisAdapter({ redisClient });
  const packr = new Packr();

  try {
    // 1. Rotate Tenant keys
    console.log('Rotating tenant encryption keys...');
    const tenantKeys = await redisAdapter.scanStream('tenant:*');

    for (const key of tenantKeys) {
      try {
        const encryptedTenant = await redisAdapter.get(key);
        const decryptedTenant = decryptWithOldKey(encryptedTenant);
        const decompressedTenant = await brotliDecompress(decryptedTenant);

        // Re-encrypt with new key
        const compressedTenant = await brotliCompress(decompressedTenant);
        const newEncryptedTenant = encryptWithNewKey(compressedTenant);

        // Save back to Redis
        await redisAdapter.set(key, newEncryptedTenant);
        console.log(`Rotated key for ${key}`);
      } catch (error) {
        console.error(`Error rotating key for ${key}:`, error);
      }
    }

    // 2. Rotate User keys
    console.log('Rotating user encryption keys...');
    const userKeys = await redisAdapter.scanStream('user:*');

    for (const key of userKeys) {
      try {
        const encryptedUser = await redisAdapter.get(key);
        const decryptedUser = decryptWithOldKey(encryptedUser);
        const decompressedUser = await brotliDecompress(decryptedUser);

        // Re-encrypt with new key
        const compressedUser = await brotliCompress(decompressedUser);
        const newEncryptedUser = encryptWithNewKey(compressedUser);

        // Save back to Redis
        await redisAdapter.set(key, newEncryptedUser);
        console.log(`Rotated key for ${key}`);
      } catch (error) {
        console.error(`Error rotating key for ${key}:`, error);
      }
    }

    // 3. Rotate Session keys
    console.log('Rotating session encryption keys...');
    const sessionKeys = await redisAdapter.scanStream('session:*');

    for (const key of sessionKeys) {
      try {
        const encryptedSession = await redisAdapter.get(key);
        const decryptedSession = decryptWithOldKey(encryptedSession);
        const decompressedSession = await brotliDecompress(decryptedSession);

        // Re-encrypt with new key
        const compressedSession = await brotliCompress(decompressedSession);
        const newEncryptedSession = encryptWithNewKey(compressedSession);

        // Save back to Redis
        await redisAdapter.set(key, newEncryptedSession);
        console.log(`Rotated key for ${key}`);
      } catch (error) {
        console.error(`Error rotating key for ${key}:`, error);
      }
    }

    // 4. Rotate Email Verification Code keys
    console.log('Rotating email verification code keys...');
    const emailVerificationCodeKeys = await redisAdapter.scanStream(
      'emailVerificationCode:*'
    );

    for (const key of emailVerificationCodeKeys) {
      try {
        const encryptedCode = await redisAdapter.get(key);
        const decryptedCode = decryptWithOldKey(encryptedCode);

        // For email verification code, it's stored as a buffer of an integer
        const code = bufferToInt(decryptedCode);
        const buffer = intToBuffer(code);

        // Re-encrypt with new key
        const newEncryptedCode = encryptWithNewKey(buffer);

        // Get the current TTL
        const ttl = await redisClient.ttl(key);

        // Save back to Redis with the same TTL
        if (ttl > 0) {
          await redisAdapter.setWithExpiry(key, newEncryptedCode, ttl);
        } else {
          await redisAdapter.set(key, newEncryptedCode);
        }

        console.log(`Rotated key for ${key}`);
      } catch (error) {
        console.error(`Error rotating key for ${key}:`, error);
      }
    }

    // 5. Rotate Waitlist entries
    console.log('Rotating waitlist encryption keys...');
    const waitlistKey = 'waitlist';
    const waitlistData = await redisAdapter.lrange(waitlistKey, 0, -1);

    if (waitlistData.length > 0) {
      // First, create a new waitlist key
      const tempWaitlistKey = 'waitlist_new';

      for (const encryptedEmail of waitlistData) {
        try {
          const email = decryptWaitlistWithOldKey(encryptedEmail);
          const newEncryptedEmail = encryptWaitlistWithNewKey(email);

          // Add to the new waitlist
          await redisAdapter.lpush(tempWaitlistKey, newEncryptedEmail);
          console.log('Rotated waitlist entry');
        } catch (error) {
          console.error('Error rotating waitlist entry:', error);
        }
      }

      // Replace the old waitlist with the new one
      await redisClient.rename(tempWaitlistKey, waitlistKey);
      console.log('Waitlist key rotation complete');
    } else {
      console.log('No waitlist entries found');
    }

    // 6. Rotate Message entries in streams
    console.log('Rotating message encryption keys...');
    // Get all stream keys
    const streamKeys = await redisAdapter.scanStream('stream:*');

    for (const streamKey of streamKeys) {
      try {
        console.log(`Processing stream ${streamKey}...`);

        // Get all messages from the stream
        // We need to use direct Redis commands since our adapter doesn't have a method for this
        const messages = await redisClient.xrange(streamKey, '-', '+');

        if (messages.length > 0) {
          console.log(`Found ${messages.length} messages in ${streamKey}`);

          // Process each message
          for (const [messageId, fields] of messages) {
            try {
              // Messages are stored as [field1, value1, field2, value2, ...] array
              // We expect 'message' to be at index 3
              const messageType = fields[1];
              const base64Message = fields[3];

              // Decrypt with old key
              const encryptedMessage = Buffer.from(base64Message, 'base64');
              const decryptedMessage = decryptWithOldKey(encryptedMessage);
              const decompressedMessage =
                await brotliDecompress(decryptedMessage);

              // Re-encrypt with new key
              const compressedMessage =
                await brotliCompress(decompressedMessage);
              const newEncryptedMessage = encryptWithNewKey(compressedMessage);
              const newBase64Message = newEncryptedMessage.toString('base64');

              // Delete the old message
              await redisClient.xdel(streamKey, messageId);

              // Add the new message
              // Using XADD directly since we need to specify the exact ID to maintain order
              await redisClient.xadd(
                streamKey,
                messageId,
                'messageType',
                messageType,
                'message',
                newBase64Message
              );

              console.log(`Rotated message ${messageId} in ${streamKey}`);
            } catch (error) {
              console.error(
                `Error rotating message ${messageId} in ${streamKey}:`,
                error
              );
            }
          }
        }
      } catch (error) {
        console.error(`Error processing stream ${streamKey}:`, error);
      }
    }

    console.log('Encryption key rotation completed successfully!');
  } catch (error) {
    console.error('Error during encryption key rotation:', error);
    process.exit(1);
  } finally {
    // Close Redis connection
    redisClient.quit();
  }
}

// Check that at least two keys are available
if (
  Object.keys(process.env).filter(
    (key) => key === 'ENCRYPTION_KEY' || key.match(/^ENCRYPTION_KEY_\d+$/)
  ).length < 2
) {
  console.error('At least two encryption keys are required for rotation');
  process.exit(1);
}

// Execute the rotation
rotateEncryptionKeys();
