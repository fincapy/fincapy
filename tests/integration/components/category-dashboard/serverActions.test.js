import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderCategories,
  reorderSubcategories,
} from '@/components/category-dashboard/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { Session } from '@/backend/domain/session';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

const sessionId = uuidv4();
const viewerSessionId = uuidv4();
const tenantId = uuidv4();
const userId = uuidv4();
const planId = 'initial';

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(),
  };
});

const validCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign({ sessionId, type: 'session' }, process.env.JWT_SECRET, {
      expiresIn: '3h',
      algorithm: 'HS256',
    }),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const viewerCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: viewerSessionId, type: 'session' },
      process.env.JWT_SECRET,
      { expiresIn: '3h', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};
const missingCookieResolution = {
  get: vi.fn(() => undefined),
  set: vi.fn(),
  delete: vi.fn(),
};

const invalidCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: 'invalid-session', type: 'session' },
      process.env.JWT_SECRET,
      {
        expiresIn: '3h',
        algorithm: 'HS256',
      }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};
// vi.mock('next/headers', () => ({
//   cookies: vi.fn(async () => ({
//     get: vi.fn((key) => {
//       return {
//         value: jwt.sign(
//           { sessionId, type: 'session' },
//           process.env.JWT_SECRET,
//           { expiresIn: '3h', algorithm: 'HS256' }
//         ),
//       };
//     }),
//     set: vi.fn(),
//     delete: vi.fn(),
//   })),
// }));

describe('Category Dashboard Server Actions', () => {
  beforeAll(async () => {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const session = new Session({
      sessionId,
      userId,
      userRole: 'owner',
      tenantId,
      createdAt: new Date(),
      lastRotated: new Date(),
    });
    await sessionRepository.set({
      session,
      ttl: 60 * 60 * 3, // 3 hours
    });
    const viewerSession = new Session({
      sessionId: viewerSessionId,
      userId,
      userRole: 'viewer',
      tenantId,
      createdAt: new Date(),
      lastRotated: new Date(),
    });
    await sessionRepository.set({
      session: viewerSession,
      ttl: 60 * 60 * 3, // 3 hours
    });
    const transactionManager = new TransactionManager({
      redisAdapter,
    });
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
    });
    await setupNewTenantService.execute({
      tenantId,
      userId,
      email: `${userId}@test.com`,
      password: 'password',
      name: 'Test User',
      whitelistBilling: true,
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createCategory', () => {
    it('should successfully create a category', async () => {
      cookies.mockResolvedValue(validCookieResolution);
      const categoryData = {
        categoryId: uuidv4(),
        name: 'Test Category',
        monthlyGoal: 1000,
        planId: 'initial',
        type: 'spending',
      };

      const result = await createCategory(categoryData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const categoryData = {
        categoryId: uuidv4(),
        name: 'Test Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      const result = await createCategory(categoryData);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);
      const categoryData = {
        categoryId: uuidv4(),
        name: 'Test Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      const result = await createCategory(categoryData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const categoryData = {
        categoryId: uuidv4(),
        name: 'Test Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      const result = await createCategory(categoryData);

      expect(result).toBe(false);
    });
  });

  describe('updateCategory', () => {
    it('should successfully update a category', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a category
      const categoryId = uuidv4();
      const createData = {
        categoryId,
        name: 'Original Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      await createCategory(createData);

      // Then update it
      const updateData = {
        categoryId,
        name: 'Updated Category',
        monthlyGoal: 1500,
        planId,
      };

      const result = await updateCategory(updateData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const updateData = {
        categoryId: uuidv4(),
        name: 'Updated Category',
        monthlyGoal: 1500,
        planId,
      };

      const result = await updateCategory(updateData);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const updateData = {
        categoryId: uuidv4(),
        name: 'Updated Category',
        monthlyGoal: 1500,
        planId,
      };

      const result = await updateCategory(updateData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const updateData = {
        categoryId: uuidv4(),
        name: 'Updated Category',
        monthlyGoal: 1500,
        planId,
      };

      const result = await updateCategory(updateData);

      expect(result).toBe(false);
    });
  });

  describe('deleteCategory', () => {
    it('should successfully delete a category', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a category
      const categoryId = uuidv4();
      const createData = {
        categoryId,
        name: 'Category to Delete',
        monthlyGoal: 1000,
        planId,
        type: 'spending',
      };

      await createCategory(createData);

      // Then delete it
      const deleteData = {
        categoryId,
        planId,
      };

      const result = await deleteCategory(deleteData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const deleteData = {
        categoryId: uuidv4(),
        planId,
      };

      const result = await deleteCategory(deleteData);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const deleteData = {
        categoryId: uuidv4(),
        planId,
      };

      const result = await deleteCategory(deleteData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const deleteData = {
        categoryId: uuidv4(),
        planId,
      };

      const result = await deleteCategory(deleteData);

      expect(result).toBe(false);
    });
  });

  describe('createSubcategory', () => {
    it('should successfully create a subcategory', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a parent category
      const categoryId = uuidv4();
      const createCategoryData = {
        categoryId,
        name: 'Parent Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      await createCategory(createCategoryData);

      // Then create a subcategory
      const subcategoryData = {
        subcategoryId: uuidv4(),
        categoryId,
        name: 'Test Subcategory',
        monthlyGoal: 500,
        planId,
      };

      const result = await createSubcategory(subcategoryData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const subcategoryData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        name: 'Test Subcategory',
        monthlyGoal: 500,
        planId,
      };

      const result = await createSubcategory(subcategoryData);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const subcategoryData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        name: 'Test Subcategory',
        monthlyGoal: 500,
        planId,
      };

      const result = await createSubcategory(subcategoryData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const subcategoryData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        name: 'Test Subcategory',
        monthlyGoal: 500,
        planId,
      };

      const result = await createSubcategory(subcategoryData);

      expect(result).toBe(false);
    });
  });

  describe('updateSubcategory', () => {
    it('should successfully update a subcategory', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a parent category
      const categoryId = uuidv4();
      const createCategoryData = {
        categoryId,
        name: 'Parent Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      await createCategory(createCategoryData);

      // Then create a subcategory
      const subcategoryId = uuidv4();
      const createSubcategoryData = {
        subcategoryId,
        categoryId,
        name: 'Original Subcategory',
        monthlyGoal: 500,
        planId,
      };

      await createSubcategory(createSubcategoryData);

      // Then update it
      const updateData = {
        subcategoryId,
        categoryId,
        name: 'Updated Subcategory',
        monthlyGoal: 750,
        planId,
      };

      const result = await updateSubcategory(updateData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const updateData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        name: 'Updated Subcategory',
        monthlyGoal: 750,
        planId,
      };

      const result = await updateSubcategory(updateData);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const updateData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        name: 'Updated Subcategory',
        monthlyGoal: 750,
        planId,
      };

      const result = await updateSubcategory(updateData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const updateData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        name: 'Updated Subcategory',
        monthlyGoal: 750,
        planId,
      };

      const result = await updateSubcategory(updateData);

      expect(result).toBe(false);
    });
  });

  describe('deleteSubcategory', () => {
    it('should successfully delete a subcategory', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a parent category
      const categoryId = uuidv4();
      const createCategoryData = {
        categoryId,
        name: 'Parent Category',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      };

      await createCategory(createCategoryData);

      // Then create a subcategory
      const subcategoryId = uuidv4();
      const createSubcategoryData = {
        subcategoryId,
        categoryId,
        name: 'Subcategory to Delete',
        monthlyGoal: 500,
        planId,
      };

      await createSubcategory(createSubcategoryData);

      // Then delete it
      const deleteData = {
        subcategoryId,
        categoryId,
        planId,
        type: 'spending',
      };

      const result = await deleteSubcategory(deleteData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const deleteData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        planId,
        type: 'expense',
      };

      const result = await deleteSubcategory(deleteData);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const deleteData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        planId,
        type: 'expense',
      };

      const result = await deleteSubcategory(deleteData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const deleteData = {
        subcategoryId: uuidv4(),
        categoryId: uuidv4(),
        planId,
        type: 'expense',
      };

      const result = await deleteSubcategory(deleteData);

      expect(result).toBe(false);
    });
  });

  describe('reorderCategories', () => {
    it('should successfully reorder categories', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // Create multiple categories first
      const categoryId1 = uuidv4();
      const categoryId2 = uuidv4();

      await createCategory({
        categoryId: categoryId1,
        name: 'Category 1',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      });

      await createCategory({
        categoryId: categoryId2,
        name: 'Category 2',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      });

      // Then reorder them
      const reorderData = {
        planId,
        type: 'expense',
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderCategories(reorderData);

      expect(result).toBe(true);
    });

    it('should return true when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      // Create multiple categories first
      const categoryId1 = uuidv4();
      const categoryId2 = uuidv4();

      await createCategory({
        categoryId: categoryId1,
        name: 'Category 1',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      });

      await createCategory({
        categoryId: categoryId2,
        name: 'Category 2',
        monthlyGoal: 1000,
        planId,
        type: 'expense',
      });

      // Then reorder them
      const reorderData = {
        planId,
        type: 'expense',
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderCategories(reorderData);

      expect(result).toBe(true);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const reorderData = {
        planId,
        type: 'spending',
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderCategories(reorderData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const reorderData = {
        planId,
        type: 'expense',
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderCategories(reorderData);

      expect(result).toBe(false);
    });
  });

  describe('reorderSubcategories', () => {
    it('should successfully reorder subcategories', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a parent category
      const categoryId = uuidv4();
      const createCategoryData = {
        categoryId,
        name: 'Parent Category',
        monthlyGoal: 1000,
        planId,
        type: 'spending',
      };

      await createCategory(createCategoryData);

      // Create multiple subcategories
      const subcategoryId1 = uuidv4();
      const subcategoryId2 = uuidv4();

      await createSubcategory({
        subcategoryId: subcategoryId1,
        categoryId,
        name: 'Subcategory 1',
        monthlyGoal: 500,
        planId,
      });

      await createSubcategory({
        subcategoryId: subcategoryId2,
        categoryId,
        name: 'Subcategory 2',
        monthlyGoal: 500,
        planId,
      });

      // Then reorder them
      const reorderData = {
        planId,
        categoryId,
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderSubcategories(reorderData);

      expect(result).toBe(true);
    });

    it('should return true when user role is viewer', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a parent category
      const categoryId = uuidv4();
      const createCategoryData = {
        categoryId,
        name: 'Parent Category',
        monthlyGoal: 1000,
        planId,
        type: 'spending',
      };

      await createCategory(createCategoryData);

      // Create multiple subcategories
      const subcategoryId1 = uuidv4();
      const subcategoryId2 = uuidv4();

      await createSubcategory({
        subcategoryId: subcategoryId1,
        categoryId,
        name: 'Subcategory 1',
        monthlyGoal: 500,
        planId,
      });

      await createSubcategory({
        subcategoryId: subcategoryId2,
        categoryId,
        name: 'Subcategory 2',
        monthlyGoal: 500,
        planId,
      });

      // Then reorder them
      const reorderData = {
        planId,
        categoryId,
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderSubcategories(reorderData);

      expect(result).toBe(true);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const reorderData = {
        planId,
        categoryId: uuidv4(),
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderSubcategories(reorderData);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const reorderData = {
        planId,
        categoryId: uuidv4(),
        oldIndex: 0,
        newIndex: 1,
      };

      const result = await reorderSubcategories(reorderData);

      expect(result).toBe(false);
    });
  });
});
