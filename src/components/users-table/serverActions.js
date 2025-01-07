'use server';

import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { getSession } from '@auth0/nextjs-auth0';
import { RemoveUserService } from '@/backend/services/removeUserService';
import { ChangeUserRoleService } from '@/backend/services/changeUserRoleService';
import { ChangeUserNameService } from '@/backend/services/changeUserNameService';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';

const removeUser = async (email) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const auth0Adapter = new Auth0Adapter({ client: auth0Client });
  const removeUserService = new RemoveUserService({
    tenantRepository,
    auth0Adapter,
  });
  await removeUserService.execute({ tenantId, email });
};

const changeUserRole = async ({ email, role }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;
  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const changeUserRoleService = new ChangeUserRoleService({
    tenantRepository,
  });
  await changeUserRoleService.execute({ tenantId, email, role });
};

const changeUserName = async ({ email, name }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;
  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const changeUserNameService = new ChangeUserNameService({
    tenantRepository,
  });
  await changeUserNameService.execute({ tenantId, email, name });
};

export { removeUser, changeUserRole, changeUserName };
