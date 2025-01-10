import FinancialInstitutionsDashboard from '@/components/financial-institutions-dashboard';
import { FinancialInstitutionsView } from '@/backend/views/financialInstitutionsView';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { getSession } from '@auth0/nextjs-auth0';

export default async function Home() {
  const session = await getSession();
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const financialInstitutionsView = new FinancialInstitutionsView({
    tenantRepository,
  });
  const links = await financialInstitutionsView.get({ tenantId });

  return <FinancialInstitutionsDashboard links={links} />;
}
