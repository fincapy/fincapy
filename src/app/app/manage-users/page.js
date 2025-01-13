import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import Dashboard from '@/components/users-dashboard';
import { headers } from 'next/headers';
export default async function ManageUsersPage() {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const [tenant, etag] = await tenantRepository.get({ tenantId });
  return <Dashboard users={tenant.users} />;
}
