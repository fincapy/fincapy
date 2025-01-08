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
  constructor({ tigrisAdapter }) {
    this.tigrisAdapter = tigrisAdapter;
  }

  async get({ tenantId }) {
    const response = await this.tigrisAdapter.get({
      bucket: process.env.BUCKET_NAME,
      key: tenantId,
    });
    if (response === null) {
      return null;
    }
    const [tenantObject, etag] = response;

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
    return [tenant, etag];
  }

  async getAllTenantIds() {
    const objects = await this.tigrisAdapter.list({
      bucket: process.env.BUCKET_NAME,
    });
    const tenantIds = objects.map((object) => {
      return object.Key;
    });
    return tenantIds;
  }

  async put({ tenantId, tenant, etag }) {
    const packr = new Packr();
    const packedTenant = packr.pack(tenant);
    const compressedTenant = await brotliCompress(packedTenant);
    await this.tigrisAdapter.put({
      bucket: process.env.BUCKET_NAME,
      key: tenantId,
      body: compressedTenant,
      etag,
    });
  }
}

export { TenantRepository };
