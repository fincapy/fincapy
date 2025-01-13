import FinancialInstitutionsDashboard from '@/components/financial-institutions-dashboard';
import { FinancialInstitutionsView } from '@/backend/views/financialInstitutionsView';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { getSession } from '@auth0/nextjs-auth0';
import { headers } from 'next/headers';

export default async function Home() {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const financialInstitutionsView = new FinancialInstitutionsView({
    tenantRepository,
  });
  const links = await financialInstitutionsView.get({ tenantId });

  return <FinancialInstitutionsDashboard links={links} />;
}
