import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { cookies } from 'next/headers';

/**
 * Verify if the user is authenticated for high-risk actions
 * @returns {Promise<Object>} - The decoded token if valid, null otherwise
 */
export async function verifyHighRiskActionToken() {
  try {
    const cookiesList = await cookies();
    console.log('cookiesList', cookiesList);
    const token = cookiesList.get('highRiskActionValidatedToken')?.value;
    console.log('token', token);
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('decoded', decoded);
    console.log('decoded.type', decoded.type);
    console.log('decoded.jti', decoded.jti);
    if (decoded.type !== 'highRiskActionValidated' || !decoded.jti) {
      return null;
    }

    // Set up Redis adapter for token tracking
    const redisAdapter = new RedisAdapter({ redisClient });

    // Check if token has already been used
    const tokenKey = `used_token:${decoded.jti}`;
    const isUsed = await redisAdapter.get(tokenKey);

    if (isUsed) {
      console.log('Token has already been used:', decoded.jti);
      return null;
    }

    // Mark token as used by storing its JTI in Redis
    await redisAdapter.setWithExpiry(tokenKey, 'used', 60 * 5);

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
