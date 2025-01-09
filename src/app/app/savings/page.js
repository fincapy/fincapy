import Dashboard from '@/components/category-dashboard';
import { getSession } from '@auth0/nextjs-auth0';
import { SavingsCategoriesView } from '@/backend/views/savingsCategoriesView';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { parse } from 'date-fns';

export default async function DashboardPage({ searchParams }) {
  const session = await getSession();
  const { user } = session;
  const tigris = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter: tigris });
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
    tenantId: user.tenant_id,
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
