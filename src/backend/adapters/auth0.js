import { ManagementClient } from 'auth0';

class Auth0Adapter {
  constructor(client) {
    this.client = client;
  }

  async getUserByEmail(email) {
    const response = await this.client.usersByEmail.getByEmail({ email });
    console.log('getUserByEmailResponse', response);
    return response.data[0];
  }

  async getUsersByTenantId(tenantId) {
    const query = `app_metadata.tenant_id:"${tenantId}"`;
    const response = await this.client.users.getAll({
      q: query,
      search_engine: 'v3',
    });
    console.log('getUsersByTenantResponse', response);
    return response.data;
  }

  async updateUserAppMetadata(userId, appMetadata) {
    try {
      await this.client.users.update(
        { id: userId },
        { app_metadata: appMetadata }
      );
    } catch (error) {
      console.error('Error updating user app metadata', error);
    }
  }
}

const auth0Client = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

export { Auth0Adapter, auth0Client };
