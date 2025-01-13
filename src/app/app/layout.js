import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { headers } from 'next/headers';

export default async function Layout({ children }) {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const nonce = headersList.get('x-nonce');
  const userEmail = headersList.get('x-user-email');

  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId });

  if (!tenant) {
    return <div>Tenant not found</div>;
  }
  const user = tenant.users.find((user) => user.email === userEmail);
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
    <DashboardLayout userName={user.name} userRole={user.role} nonce={nonce}>
      {children}
    </DashboardLayout>
  );
}
