import Dashboard from '@/components/category-dashboard';
import { SavingsCategoriesView } from '@/backend/views/savingsCategoriesView';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { parse } from 'date-fns';
import { headers } from 'next/headers';
export default async function DashboardPage({ searchParams }) {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const view = new SavingsCategoriesView({ tenantRepository });
  const currentDate = new Date();

  let startDate = null;
  if (searchParams.startDate) {
    startDate = parse(searchParams.startDate, 'yyyy-MM-dd', new Date());
  } else {
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }

  let endDate = null;
  if (searchParams.endDate) {
    endDate = parse(searchParams.endDate, 'yyyy-MM-dd', new Date());
  } else {
    endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
  }

  const categories = await view.get({
    tenantId,
    startDate,
    endDate,
    planId: 'initial',
  });
  return (
    <Dashboard
      categories={categories}
      startDate={startDate.toISOString().split('T')[0]}
      endDate={endDate.toISOString().split('T')[0]}
      type="savings"
    />
  );
}
