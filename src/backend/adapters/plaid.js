import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use 'development' or 'production' for other environments
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const client = new PlaidApi(configuration);

class PlaidAdapter {
  constructor(client) {
    this.client = client;
  }

  async createLinkToken({ tenantId }) {
    const response = await this.client.linkTokenCreate({
      user: {
        client_user_id: tenantId, // Replace with a unique identifier for your user
      },
      client_name: 'SpendMore',
      products: ['transactions'], // Specify the products you need
      country_codes: ['US'],
      language: 'en',
      redirect_uri: '', // For OAuth flows
    });
    return response.data.link_token;
  }

  async exchangePublicToken(public_token) {
    const response = await this.client.itemPublicTokenExchange({
      public_token: public_token,
    });
    return response.data.access_token;
  }
}

export { PlaidAdapter, client };
