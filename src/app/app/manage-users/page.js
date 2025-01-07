import { getSession } from '@auth0/nextjs-auth0';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import Dashboard from '@/components/users-dashboard';

export default async function ManageUsersPage() {
  const session = await getSession();
  const auth0User = session.user;
  const tenantId = auth0User.tenant_id;
  const tigris = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter: tigris });
  const [tenant, etag] = await tenantRepository.get({ tenantId });
  console.log(tenant.users);
  return <Dashboard users={tenant.users} />;
}
