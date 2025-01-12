import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';

export default async function Layout({ children }) {
  const session = await getSession();

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const auth0User = session.user;
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId: auth0User.tenant_id });
  if (!tenant) {
    return <div>Tenant not found</div>;
  }
  const user = tenant.users.find((user) => user.email === auth0User.email);
  if (tenant.billingStatus === 'unpaid' || !tenant.billingStatus) {
    redirect(
      `https://buy.stripe.com/test_6oEeVmgk19t71moeUU?prefilled_email=${encodeURIComponent(user.email)}`
    );
  }

  if (tenant.billingStatus === 'cancelled') {
    redirect('https://billing.stripe.com/p/login/test_7sI28i4mUcdG8Ok4gg');
  }

  if (tenant.billingStatus === 'payment_failed') {
    redirect('https://billing.stripe.com/p/login/test_7sI28i4mUcdG8Ok4gg');
  }

  return (
    <DashboardLayout auth0User={auth0User} user={user}>
      {children}
    </DashboardLayout>
  );
}
