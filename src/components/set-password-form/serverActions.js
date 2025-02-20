'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { ResetPasswordService } from '@/backend/services/resetPasswordService';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function resetPassword(newPassword) {
  const resetToken = cookies().get('reset-password-token');
  if (!resetToken) {
    return false;
  }

  let jwtToken;
  try {
    jwtToken = await jwt.verify(resetToken.value, process.env.JWT_SECRET);
  } catch (error) {
    return false;
  }

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const resetPasswordService = new ResetPasswordService({ userRepository });

  try {
    await resetPasswordService.resetPassword({
      userId: jwtToken.userId,
      newPassword
    });

    // Clear the reset token cookie
    cookies().delete('reset-password-token');
    
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    return false;
  }
}
