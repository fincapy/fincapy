import DashboardLayout from '@/components/dashboard-layout';
import { redirect } from 'next/navigation';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { cookies, headers } from 'next/headers';
import { parse } from 'date-fns';
import { Providers } from '@/components/state/provider';
import { Toaster } from '@/components/ui/toaster';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';

export default async function Layout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');
  let startDate;
  let endDate;
  let planId;
  const page = headersList.get('x-page');

  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.getSession({ cookies: await cookies() });

  if (!session) {
    redirect('/signin');
  }

  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: session.userId });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId: user.tenantId });

  if (!tenant) {
    redirect('/signin');
  }
  if (tenant.billingStatus === 'unpaid' || !tenant.billingStatus) {
    redirect(
      `https://buy.stripe.com/test_6oEeVmgk19t71moeUU?prefilled_email=${encodeURIComponent(userEmail)}`
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

  if (startDate) {
    startDate = parse(startDate, 'yyyy-MM-dd', new Date());
  }

  if (endDate) {
    endDate = parse(endDate, 'yyyy-MM-dd', new Date());
  }

  const plan = tenant.plans.find((plan) => plan.planId === planId);
  const planView = plan.toView();
  let users = [];
  if (user.role === 'owner') {
    users = tenant.users;
  }
  const plaidItems = tenant.plaidItems.map((plaidItem) => {
    return {
      institutionId: plaidItem.institutionId,
      institutionName: plaidItem.institutionName,
      status: plaidItem.status,
      userId: plaidItem.userId,
      plaidItemId: plaidItem.plaidItemId,
    };
  });

  return (
    <Providers>
      <DashboardLayout
        userEmail={user.emails[0]}
        userRole={user.role}
        userId={user.id}
        nonce={nonce}
        plan={planView}
        startDate={startDate}
        endDate={endDate}
        plaidItems={plaidItems}
        users={users}
        pageParam={page}
      >
        {children}
      </DashboardLayout>
      <Toaster />
    </Providers>
  );
}
