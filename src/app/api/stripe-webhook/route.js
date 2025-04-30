import Stripe from 'stripe';
import { SetTenantPaymentSucceededService } from '@/backend/services/setTenantPaymentSucceededService';
import { SetTenantPaymentFailedService } from '@/backend/services/setTenantPaymentFailedService';
import { SetTenantCancelledService } from '@/backend/services/setTenantCancelledService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { TransactionManager } from '@/backend/adapters/transactionManager';

export const POST = async (req) => {
  if (!process.env.STRIPE_SECRET || !process.env.STRIPE_WHSEC) {
    console.error('Missing required Stripe environment variables');
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 400,
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET);

  let event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WHSEC
    );
  } catch (error) {
    console.log('stripe webhook failed to parse event');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 400,
    });
  }

  const plaidAdapter = new PlaidAdapter({ client });
  const transactionManager = new TransactionManager();
  let service;
  switch (event.type) {
    case 'invoice.payment_succeeded':
      console.log('customer_email', event.data.object.customer_email);
      service = new SetTenantPaymentSucceededService(transactionManager);
      await service.execute(event.data.object.customer_email);
      break;
    case 'invoice.payment_failed':
      service = new SetTenantPaymentFailedService(
        transactionManager,
        plaidAdapter
      );
      await service.execute(event.data.object.customer_email);
      break;
    case 'customer.subscription.deleted':
      service = new SetTenantCancelledService(transactionManager, plaidAdapter);
      await service.execute(event.data.object.customer_email);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
