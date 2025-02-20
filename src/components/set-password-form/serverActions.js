'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function setInitialPassword(newPassword) {
  const joinToken = cookies().get('join-token');
  if (!joinToken) {
    return false;
  }

  let jwtToken;
  try {
    jwtToken = await jwt.verify(joinToken.value, process.env.JWT_SECRET);
  } catch (error) {
    return false;
  }

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: jwtToken.userId });

  if (!user) {
    return false;
  }

  // Hash and set the initial password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  user.password = hashedPassword;
  
  await userRepository.set({ 
    userId: user.id, 
    user 
  });

  // Create session for the new user
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.createSession({
    userId: jwtToken.userId,
    tenantId: jwtToken.tenantId,
    cookies: cookies(),
  });

  // Set session cookie
  const sessionToken = jwt.sign(
    { sessionId: session.sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '3h' }
  );
  cookies().set('session-id', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 3,
  });

  // Clear join token
  cookies().delete('join-token');
    
  return true;
}
