'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';

const fetchLinkToken = async () => {
  const plaidAdapter = new PlaidAdapter(client);
  const linkToken = await plaidAdapter.createLinkToken('123');
  return linkToken;
};

const exchangePublicToken = async (public_token) => {
  const plaidAdapter = new PlaidAdapter(client);
  const accessToken = await plaidAdapter.exchangePublicToken(public_token);
  return accessToken;
};

export { fetchLinkToken, exchangePublicToken };
