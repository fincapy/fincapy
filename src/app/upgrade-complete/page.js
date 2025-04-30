import { headers } from 'next/headers';
import Image from 'next/image';
import UpgradeCompletePage from '@/components/upgrade-complete-page';
import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import Stripe from 'stripe';
import { cookies } from 'next/headers';

export default async function UpgradeComplete({ searchParams }) {
  const params = await searchParams;
  const stripeSessionId = params.session_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionManager = new SessionManager({
    sessionRepository: new SessionRepository({ redisAdapter }),
  });
  const cookiesList = await cookies();
  const session = await sessionManager.touchSession({
    cookies: cookiesList,
  });
  if (!session) {
    redirect('/signin');
  }

  if (!process.env.STRIPE_SECRET) {
    console.error('Missing required Stripe environment variables');
    return <div>Unauthorized</div>;
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET);
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
  } catch (error) {
    console.error(error);
    return <div>Unauthorized</div>;
  }

  return <UpgradeCompletePage paymentStatus={stripeSession.payment_status} />;
}
