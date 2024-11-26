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

class PlaidTransactions {
  constructor({ accounts, added, removed, modified, next_cursor }) {
    this.accounts = accounts;
    this.added = added;
    this.removed = removed;
    this.modified = modified;
    this.next_cursor = next_cursor;
  }
}

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
    const added = [];
    const removed = [];
    const modified = [];
    const accounts = {};
    let modifiable_cursor = cursor;
    let response = null;
    do {
      response = await this.client.transactionsSync({
        access_token: accessToken,
        cursor: modifiable_cursor,
        options: {
          include_original_description: true,
        },
      });

      added.push(...response.data.added);
      removed.push(...response.data.removed);
      modified.push(...response.data.modified);
      for (const account of response.data.accounts) {
        accounts[account.account_id] = account;
      }
      modifiable_cursor = response.data.next_cursor;
    } while (response.data.has_more);

    return new PlaidTransactions({
      accounts: accounts,
      added: added,
      removed: removed,
      modified: modified,
      next_cursor: modifiable_cursor,
    });
  }

  async refreshTransactions({ accessToken }) {
    const response = await this.client.transactionsRefresh({
      access_token: accessToken,
    });
    return response.data;
  }
}

export { PlaidAdapter, client };
