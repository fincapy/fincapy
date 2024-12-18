import { Packr } from 'msgpackr';

class PlanRepository {
  constructor({ tigrisAdapter }) {
    this.tigrisAdapter = tigrisAdapter;
  }

  async get({ tenantId, planId }) {
    const planObject = await this.tigrisAdapter.get({
      bucket: 'spendmore',
      key: planId ? `${tenantId}/${planId}` : `${tenantId}/initial`,
    });

    if (planObject === null) {
      return null;
    }

    const packr = new Packr();
    return packr.unpack(planObject);
  }

  async put({ tenantId, planId, plan }) {
    const packr = new Packr();
    const packedPlan = packr.pack(plan);
    await this.tigrisAdapter.put({
      bucket: 'spendmore',
      key: planId ? `${tenantId}/${planId}` : `${tenantId}/initial`,
      body: packedPlan,
    });
  }
}

export { PlanRepository };
