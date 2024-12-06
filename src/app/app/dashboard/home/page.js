import Dashboard from '@/components/dashboard';
import { getSession } from '@auth0/nextjs-auth0';
import { SpendingCategoriesView } from '@/backend/views/spendingCategoriesView';
import { db } from '@/backend/adapters/database';

export default async function DashboardPage() {
  const session = await getSession();
  const { user } = session;
  const view = new SpendingCategoriesView(db);
  const spendingCategories = await view.get({ tenantId: user.tenant_id });

  if (session) {
    const user = session.user;
  }
  return <Dashboard spendingCategories={spendingCategories} />;
}
