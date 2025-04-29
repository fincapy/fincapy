'use server';

import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { parse, isValid } from 'date-fns';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

export async function createCheckoutSession(priceId) {
  if (!process.env.STRIPE_SECRET) {
    console.error('Missing required Stripe environment variables');
    return false;
  }

  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({
    redisAdapter,
  });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    cookies: await cookies(),
  });

  if (!session) {
    return redirect('/signin');
  }

  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: session.userId });

  const accessToken = jwt.sign(
    { type: 'upgrade', userId: session.userId, tenantId: session.tenantId },
    process.env.JWT_SECRET,
    {
      expiresIn: 5 * 60, // 5 minutes
      algorithm: 'HS256',
    }
  );

  const stripe = new Stripe(process.env.STRIPE_SECRET);
  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    customer_email: user.emails.find((email) => email.primary).email,
    success_url: `${process.env.SITE_URL}/upgrade-complete?session_id={CHECKOUT_SESSION_ID}&access_token=${accessToken}`,
    cancel_url: `${process.env.SITE_URL}/upgrade`,
    metadata: {
      userId: session.userId,
      tenantId: session.tenantId,
    },
  });

  return redirect(checkoutSession.url);
}
