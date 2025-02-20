'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function setInitialPassword(newPassword, token) {
  let verifiedToken;
  try {
    verifiedToken = await jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return false;
  }
  const userId = verifiedToken.userId;

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId });

  if (!user) {
    return false;
  }

  // Hash and set the initial password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;

  await userRepository.set({
    userId,
    user,
  });
  return true;
}
