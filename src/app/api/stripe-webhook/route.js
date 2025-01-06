import Stripe from 'stripe';
import { SetTenantPaymentSucceededService } from '@/backend/services/setTenantPaymentSucceededService';
import { SetTenantPaymentFailedService } from '@/backend/services/setTenantPaymentFailedService';
import { SetTenantCancelledService } from '@/backend/services/setTenantCancelledService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';

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

  try {
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_ENDPOINT_SECRET
    );

    const tigrisAdapter = new TigrisAdapter({ client: s3client });
    const tenantRepository = new TenantRepository({ tigrisAdapter });
    const auth0Adapter = new Auth0Adapter(auth0Client);
    let service;
    switch (event.type) {
      case 'invoice.payment_succeeded':
        service = new SetTenantPaymentSucceededService(
          tenantRepository,
          auth0Adapter
        );
        await service.execute(event.data.object.customer_email);
        break;
      case 'invoice.payment_failed':
        service = new SetTenantPaymentFailedService(
          tenantRepository,
          auth0Adapter
        );
        await service.execute(event.data.object.customer_email);
        break;
      case 'customer.subscription.deleted':
        service = new SetTenantCancelledService(tenantRepository, auth0Adapter);
        await service.execute(event.data.object.customer_email);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 400,
    });
  }
};
