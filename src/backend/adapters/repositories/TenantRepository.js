import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { Tenant } from '@/backend/domain/tenant';
import { Plan } from '@/backend/domain/plan';
import { PlaidItem } from '@/backend/domain/plaidItem';
import { SpendingCategory } from '@/backend/domain/spendingCategory';
import { IncomeCategory } from '@/backend/domain/incomeCategory';
import { SavingsCategory } from '@/backend/domain/savingsCategory';
import { SpendingSubcategory } from '@/backend/domain/spendingSubcategory';
import { IncomeSubcategory } from '@/backend/domain/incomeSubcategory';
import { SavingsSubcategory } from '@/backend/domain/savingsSubcategory';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

class TenantRepository {
  constructor({ tigrisAdapter }) {
    this.tigrisAdapter = tigrisAdapter;
  }

  async get({ tenantId }) {
    const tenantObject = await this.tigrisAdapter.get({
      bucket: 'spendmore',
      key: tenantId,
    });
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
        if (category.type === 'spending') {
          category = new SpendingCategory(category);
          category.subcategories = category?.subcategories.map(
            (subcategory) => {
              return new SpendingSubcategory(subcategory);
            }
          );
        } else if (category.type === 'income') {
          category = new IncomeCategory(category);
          category.subcategories = category?.subcategories.map(
            (subcategory) => {
              return new IncomeSubcategory(subcategory);
            }
          );
        } else if (category.type === 'savings') {
          category = new SavingsCategory(category);
          category.subcategories = category?.subcategories.map(
            (subcategory) => {
              return new SavingsSubcategory(subcategory);
            }
          );
        }
        return category;
      });
      return plan;
    });
    return tenant;
  }

  async put({ tenantId, tenant }) {
    const packr = new Packr();
    const packedTenant = packr.pack(tenant);
    const compressedTenant = await brotliCompress(packedTenant);
    await this.tigrisAdapter.put({
      bucket: 'spendmore',
      key: tenantId,
      body: compressedTenant,
    });
  }
}

export { TenantRepository };
