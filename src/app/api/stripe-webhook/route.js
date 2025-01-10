import Stripe from 'stripe';
import { SetTenantPaymentSucceededService } from '@/backend/services/setTenantPaymentSucceededService';
import { SetTenantPaymentFailedService } from '@/backend/services/setTenantPaymentFailedService';
import { SetTenantCancelledService } from '@/backend/services/setTenantCancelledService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';

export const POST = async (req) => {
  if (!process.env.STRIPE_API_KEY || !process.env.STRIPE_ENDPOINT_SECRET) {
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

  const stripe = new Stripe(process.env.STRIPE_API_KEY);

  let event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_ENDPOINT_SECRET
    );
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 400,
    });
  }

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const auth0Adapter = new Auth0Adapter({ client: auth0Client });
  const plaidAdapter = new PlaidAdapter({ client });
  let service;
  switch (event.type) {
    case 'invoice.payment_succeeded':
      try {
        service = new SetTenantPaymentSucceededService(
          tenantRepository,
          auth0Adapter
        );
        await service.execute(event.data.object.customer_email);
      } catch (error) {
        console.log(error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
          }
        );
      }
      break;
    case 'invoice.payment_failed':
      service = new SetTenantPaymentFailedService(
        tenantRepository,
        auth0Adapter,
        plaidAdapter
      );
      await service.execute(event.data.object.customer_email);
      break;
    case 'customer.subscription.deleted':
      service = new SetTenantCancelledService(
        tenantRepository,
        auth0Adapter,
        plaidAdapter
      );
      await service.execute(event.data.object.customer_email);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
