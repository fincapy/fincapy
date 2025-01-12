import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { Tenant } from '@/backend/domain/tenant';
import { Plan } from '@/backend/domain/plan';
import { PlaidItem } from '@/backend/domain/plaidItem';
import { Category } from '@/backend/domain/category';
import { Subcategory } from '@/backend/domain/subcategory';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

class TenantRepository {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async get({ tenantId }) {
    const tenantObject = await this.redisAdapter.get(tenantId);
    if (tenantObject === null) {
      return null;
    }
    const decompressedTenant = await brotliDecompress(tenantObject);
    const packr = new Packr();
    const unpackedTenant = packr.unpack(decompressedTenant);
    const tenant = new Tenant(unpackedTenant);

    tenant.plaidItems = tenant.plaidItems.map((plaidItem) => {
      plaidItem = new PlaidItem(plaidItem);
      return plaidItem;
    });

    tenant.plans = tenant.plans.map((plan) => {
      plan = new Plan(plan);
      plan.categories = plan.categories.map((category) => {
        category = new Category(category);
        category.subcategories = category?.subcategories.map((subcategory) => {
          return new Subcategory(subcategory);
        });
        return category;
      });
      return plan;
    });
    return tenant;
  }

  async getWithTransaction({ tenantId }) {
    const tenantObject = await this.redisAdapter.getWithTransaction(tenantId);
    if (tenantObject === null) {
      return null;
    }
    const decompressedTenant = await brotliDecompress(tenantObject);
    const packr = new Packr();
    const unpackedTenant = packr.unpack(decompressedTenant);
    const tenant = new Tenant(unpackedTenant);

    tenant.plaidItems = tenant.plaidItems.map((plaidItem) => {
      plaidItem = new PlaidItem(plaidItem);
      return plaidItem;
    });

    tenant.plans = tenant.plans.map((plan) => {
      plan = new Plan(plan);
      plan.categories = plan.categories.map((category) => {
        category = new Category(category);
        category.subcategories = category?.subcategories.map((subcategory) => {
          return new Subcategory(subcategory);
        });
        return category;
      });
      return plan;
    });
    return tenant;
  }

  async getAllTenantIds() {
    let cursor = 0;
    let tenantIds = [];
    do {
      const [newCursor, batch] = await this.redisAdapter.scan(cursor, {
        MATCH: '*',
        COUNT: 100,
      });
      cursor = newCursor;
      tenantIds.push(...batch);
    } while (cursor !== 0);
    return tenantIds;
  }

  async set({ tenantId, tenant }) {
    const packr = new Packr();
    const packedTenant = packr.pack(tenant);
    const compressedTenant = await brotliCompress(packedTenant);
    await this.redisAdapter.set(tenantId, compressedTenant);
  }
}

export { TenantRepository };
