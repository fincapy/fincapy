import DashboardLayout from '@/components/dashboard-layout';
import { redirect } from 'next/navigation';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { headers } from 'next/headers';
import { parse } from 'date-fns';
import { Providers } from '@/components/state/provider';

export default async function Layout({ children }) {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const nonce = headersList.get('x-nonce');
  const userEmail = headersList.get('x-user-email');
  let startDate = headersList.get('x-start-date');
  let endDate = headersList.get('x-end-date');
  let planId = headersList.get('x-plan-id');

  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId });

  if (!tenant) {
    return <div>Tenant not found</div>;
  }
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

  if (!planId) {
    planId = 'initial';
  }

  const currentDate = new Date();
  if (startDate) {
    startDate = parse(startDate, 'yyyy-MM-dd', new Date());
  } else {
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }

  if (endDate) {
    endDate = parse(endDate, 'yyyy-MM-dd', new Date());
  } else {
    endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
  }

  const plan = tenant.plans.find((plan) => plan.planId === planId);
  plan.startDate = startDate;
  plan.endDate = endDate;
  const planView = plan.toView();
  let users = [];
  const user = tenant.users.find((user) => user.email === userEmail);
  if (user.role === 'owner') {
    users = tenant.users;
  }
  const plaidItems = tenant.plaidItems.map((plaidItem) => {
    return {
      institutionId: plaidItem.institutionId,
      institutionName: plaidItem.institutionName,
    };
  });

  return (
    <Providers>
      <DashboardLayout
        userName={user.name}
        userRole={user.role}
        nonce={nonce}
        plan={planView}
        startDate={startDate}
        endDate={endDate}
        plaidItems={plaidItems}
        users={users}
      >
        {children}
      </DashboardLayout>
    </Providers>
  );
}
