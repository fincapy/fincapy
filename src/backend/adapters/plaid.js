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
    const payload = {
      user: {
        client_user_id: tenantId, // Replace with a unique identifier for your user
      },
      client_name: 'SpendMore',
      products: ['transactions'], // Specify the products you need
      country_codes: ['US'],
      language: 'en',
    };
    const response = await this.client.linkTokenCreate(payload);
    return response.data.link_token;
  }

  async exchangePublicToken({ publicToken }) {
    // add a check to make sure that the user_id and institution_id don't already exist
    const response = await this.client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return response.data.access_token;
  }

  async getTransactions({ accessToken, cursor }) {
    const response = await this.client.transactionsSync({
      access_token: accessToken,
      cursor,
    });

    return response.data;
  }

  async refreshTransactions({ accessToken }) {
    const response = await this.client.transactionsRefresh({
      access_token: accessToken,
    });
    return response.data;
  }
}

export { PlaidAdapter, client };
