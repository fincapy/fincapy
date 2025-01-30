import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';
import { Tenant } from '@/backend/domain/tenant';
import { Plan } from '@/backend/domain/plan';
import { PlaidItem } from '@/backend/domain/plaidItem';
import { Category } from '@/backend/domain/category';
import { Subcategory } from '@/backend/domain/subcategory';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
const IV_LENGTH = 12;

function encrypt(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(encryptedData) {
  const iv = encryptedData.slice(0, IV_LENGTH);
  const authTag = encryptedData.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = encryptedData.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

class TenantRepository {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async get({ tenantId }) {
    const tenantObject = await this.redisAdapter.get(tenantId);
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

  async getWithTransaction({ tenantId }) {
    const tenantObject = await this.redisAdapter.getWithTransaction(tenantId);
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
    const encryptedTenant = encrypt(compressedTenant);
    await this.redisAdapter.set(tenantId, encryptedTenant);
  }
}

export { TenantRepository };
