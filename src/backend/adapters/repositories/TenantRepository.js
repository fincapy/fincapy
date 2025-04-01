import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { encrypt, decrypt } from './encryptionUtils.js';
import { Tenant } from '../../domain/tenant.js';
import { Plan } from '../../domain/plan.js';
import { PlaidItem } from '../../domain/plaidItem.js';
import { Category } from '../../domain/category.js';
import { Subcategory } from '../../domain/subcategory.js';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

class TenantRepository {
  constructor({ redisAdapter, transactionBuilder }) {
    this.redisAdapter = redisAdapter;
    this.transactionBuilder = transactionBuilder;
  }

  async get({ tenantId }) {
    const tenantObject = await this.redisAdapter.get(`tenant:${tenantId}`);
    if (tenantObject === null) {
      return null;
    }
    if (this.transactionBuilder) {
      const version = await this.redisAdapter.get(`version:tenant:${tenantId}`);
      this.transactionBuilder.watchVersion(
        `version:tenant:${tenantId}`,
        version
      );
    }
    const decryptedTenant = decrypt(tenantObject);
    const decompressedTenant = await brotliDecompress(decryptedTenant);
    const packr = new Packr();
    const unpackedTenant = packr.unpack(decompressedTenant);
    const tenant = new Tenant(unpackedTenant);

    tenant.plaidItems = tenant.plaidItems.map(
      (plaidItem) => new PlaidItem(plaidItem)
    );
    tenant.plans = tenant.plans.map((plan) => {
      plan = new Plan(plan);
      plan.categories = plan.categories.map((category) => {
        category = new Category(category);
        category.subcategories = category?.subcategories.map(
          (subcategory) => new Subcategory(subcategory)
        );
        return category;
      });
      return plan;
    });
    return tenant;
  }

  async incrementVersion({ tenantId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addIncr(`version:tenant:${tenantId}`);
    } else {
      await this.redisAdapter.incr(`version:tenant:${tenantId}`);
    }
  }

  async getWithTransaction({ tenantId }) {
    const tenantObject = await this.redisAdapter.getWithTransaction(
      `tenant:${tenantId}`
    );
    if (tenantObject === null) {
      return null;
    }
    const decryptedTenant = decrypt(tenantObject);
    const decompressedTenant = await brotliDecompress(decryptedTenant);
    const packr = new Packr();
    const unpackedTenant = packr.unpack(decompressedTenant);
    const tenant = new Tenant(unpackedTenant);

    tenant.plaidItems = tenant.plaidItems.map(
      (plaidItem) => new PlaidItem(plaidItem)
    );
    tenant.plans = tenant.plans.map((plan) => {
      plan = new Plan(plan);
      plan.categories = plan.categories.map((category) => {
        category = new Category(category);
        category.subcategories = category?.subcategories.map(
          (subcategory) => new Subcategory(subcategory)
        );
        return category;
      });
      return plan;
    });
    return tenant;
  }

  async getAllTenantIds() {
    const keys = await this.redisAdapter.scanStream('tenant:*');
    const tenantIds = keys.map((key) => key.split(':')[1]);
    return tenantIds;
  }

  async set({ tenantId, tenant }) {
    const packr = new Packr();
    const packedTenant = packr.pack(tenant);
    const compressedTenant = await brotliCompress(packedTenant);
    const encryptedTenant = encrypt(compressedTenant);
    if (this.transactionBuilder) {
      this.transactionBuilder.addCommand('SET', [
        `tenant:${tenantId}`,
        encryptedTenant,
      ]);
    } else {
      await this.redisAdapter.set(`tenant:${tenantId}`, encryptedTenant);
    }
  }
}

export { TenantRepository };
