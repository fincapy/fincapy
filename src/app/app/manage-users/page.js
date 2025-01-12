import { getSession } from '@auth0/nextjs-auth0';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import Dashboard from '@/components/users-dashboard';

export default async function ManageUsersPage() {
  const session = await getSession();
  const auth0User = session.user;
  const tenantId = auth0User.tenant_id;
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const [tenant, etag] = await tenantRepository.get({ tenantId });
  return <Dashboard users={tenant.users} />;
}
