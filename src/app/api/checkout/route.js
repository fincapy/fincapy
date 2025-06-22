import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { parse, isValid } from 'date-fns';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

export const GET = async (req, res) => {
  // Check for Stripe API key
  if (!process.env.STRIPE_SECRET) {
    console.error('Missing required Stripe environment variables');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }

  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({
    redisAdapter,
  });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    req,
    cookies: await cookies(),
  });

  if (!session) {
    return redirect('/signin');
  }

  const url = new URL(req.url);
  const priceId = url.searchParams.get('priceId');
  if (!priceId) {
    return new Response(JSON.stringify({ error: 'Price ID is required' }), {
      status: 400,
    });
  }

  try {
    // Initialize the Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET);

    // Create a checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.emails[0],
      success_url: `${process.env.SITE_URL}/upgrade?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/upgrade`,
      metadata: {
        userId: user.id,
        tenantId: user.tenantId,
      },
    });

    return redirect(checkoutSession.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: 'Error creating checkout session',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
