import DashboardLayout from '@/components/dashboard-layout';
import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';

export default async function Layout({ children }) {
  const session = await getSession();

  if (!session) {
    return <div>Unauthorized</div>;
  }

  const user = session.user;
  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const [tenant, etag] = await tenantRepository.get({
    tenantId: user.tenant_id,
  });
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

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
