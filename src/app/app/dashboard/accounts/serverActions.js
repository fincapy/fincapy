'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { db } from '@/backend/adapters/database';
import { CreatePlaidItemService } from '@/backend/services/createPlaidItemService';
import { PlaidItemRepository } from '@/backend/adapters/repositories/plaidItemRepository';
import { getSession } from '@auth0/nextjs-auth0';

const fetchLinkToken = async () => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const plaidAdapter = new PlaidAdapter(client);
  const linkToken = await plaidAdapter.createLinkToken({ tenantId: tenantId });
  return linkToken;
};

const exchangePublicToken = async ({
  publicToken,
  institutionId,
  institutionName,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const plaidAdapter = new PlaidAdapter(client);
  const service = new CreatePlaidItemService({
    plaidItemRepositoryFactory: PlaidItemRepository,
    db,
    plaidAdapter,
  });
  const id = crypto.randomUUID();

  await service.execute({
    tenantId,
    institutionId,
    institutionName,
    publicToken,
  });
  return true;
};

export { fetchLinkToken, exchangePublicToken };
