'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function setInitialPassword(newPassword, token) {
  let verifiedToken;
  try {
    verifiedToken = await jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return false;
  }
  if (verifiedToken.type !== 'inviteUser') {
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
  user.emails[0].verified = true;

  const emailPasswordAuthenticatedToken = jwt.sign(
    {
      userId: user.id,
      mfaMethod: user.mfa_method,
      emailVerified: true,
      tenantId: user.tenantId,
      type: 'emailPasswordAuthenticated',
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  (await cookies()).set(
    'emailPasswordAuthenticatedToken',
    emailPasswordAuthenticatedToken,
    {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10,
    }
  );

  await userRepository.set({
    userId,
    user,
  });
  redirect('/register-totp');
}

export async function resetPassword(newPassword, token) {
  let verifiedToken;
  try {
    verifiedToken = await jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return false;
  }
  if (verifiedToken.type !== 'resetPassword') {
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
  user.emails[0].verified = true;

  const emailPasswordAuthenticatedToken = jwt.sign(
    {
      userId: user.id,
      mfaMethod: user.mfa_method,
      emailVerified: true,
      tenantId: user.tenantId,
      type: 'emailPasswordAuthenticated',
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  (await cookies()).set(
    'emailPasswordAuthenticatedToken',
    emailPasswordAuthenticatedToken,
    {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10,
    }
  );
  await userRepository.set({
    userId,
    user,
  });
  return true;
}
