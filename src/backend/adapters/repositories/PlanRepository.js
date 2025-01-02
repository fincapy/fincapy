import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { Plan } from '@/backend/domain/plan';
import { SpendingCategory } from '@/backend/domain/spendingCategory';
import { IncomeCategory } from '@/backend/domain/incomeCategory';
import { SavingsCategory } from '@/backend/domain/savingsCategory';
import { SpendingSubcategory } from '@/backend/domain/spendingSubcategory';
import { IncomeSubcategory } from '@/backend/domain/incomeSubcategory';
import { SavingsSubcategory } from '@/backend/domain/savingsSubcategory';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

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

    const decompressedPlan = await brotliDecompress(planObject);
    const packr = new Packr();
    const unpackedPlan = packr.unpack(decompressedPlan);
    const plan = new Plan(unpackedPlan);

    plan.categories = plan.categories.map((category) => {
      if (category.type === 'spending') {
        category = new SpendingCategory(category);
        category.subcategories = category?.subcategories.map((subcategory) => {
          return new SpendingSubcategory(subcategory);
        });
      } else if (category.type === 'income') {
        category = new IncomeCategory(category);
        category.subcategories = category?.subcategories.map((subcategory) => {
          return new IncomeSubcategory(subcategory);
        });
      } else if (category.type === 'savings') {
        category = new SavingsCategory(category);
        category.subcategories = category?.subcategories.map((subcategory) => {
          return new SavingsSubcategory(subcategory);
        });
      }
      return category;
    });
    return plan;
  }

  async put({ tenantId, planId, plan }) {
    const packr = new Packr();
    const packedPlan = packr.pack(plan);
    const compressedPlan = await brotliCompress(packedPlan);
    await this.tigrisAdapter.put({
      bucket: 'spendmore',
      key: planId ? `${tenantId}/${planId}` : `${tenantId}/initial`,
      body: compressedPlan,
    });
  }
}

export { PlanRepository };
