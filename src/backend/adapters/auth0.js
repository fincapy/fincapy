import { ManagementClient } from 'auth0';

class Auth0Adapter {
  constructor({ client }) {
    this.client = client;
  }

  async getUserByEmail(email) {
    const response = await this.client.usersByEmail.getByEmail({ email });
    return response.data[0];
  }

  async deleteUser(userId) {
    await this.client.users.delete({ id: userId });
  }

  async createUser(email, name) {
    await this.client.users.create({
      email: email,
      name: name,
      password: 'ThisIsA!Strong!Password!75663',
      connection: 'Username-Password-Authentication',
      email_verified: false,
      verify_email: false,
    });
  }

  async triggerInviteEmail(userId) {
    await this.client.tickets.verifyEmail({
      user_id: userId,
      result_url: 'http://localhost:3000/app/spending',
    });
  }

  async getUsersByTenantId(tenantId) {
    const query = `app_metadata.tenant_id:"${tenantId}"`;
    const response = await this.client.users.getAll({
      q: query,
      search_engine: 'v3',
    });
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
