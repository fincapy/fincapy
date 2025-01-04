'use server';

import { S3Client } from '@aws-sdk/client-s3';
import { TigrisAdapter } from '@/backend/adapters/tigris';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { CreateCategoryService } from '@/backend/services/createCategoryService';
import { CreateSubcategoryService } from '@/backend/services/createSubcategoryService';
import { UpdateCategoryService } from '@/backend/services/updateCategoryService';
import { DeleteCategoryService } from '@/backend/services/deleteCategoryService';
import { UpdateSubcategoryService } from '@/backend/services/updateSubcategoryService';
import { DeleteSubcategoryService } from '@/backend/services/deleteSubcategoryService';
import { getSession } from '@auth0/nextjs-auth0';

const createCategory = async ({ categoryId, name, monthlyGoal, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;
  const s3client = new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  s3client.middlewareStack.add(
    (next, context) => async (args) => {
      args.request.headers['x-tigris-cas'] = 'true';
      const result = await next(args);
      return result;
    },
    {
      step: 'build',
      name: 'addTigrisHeader',
      tags: ['HEADER', 'TIGRIS'],
    }
  );
  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new CreateCategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    categoryId,
    name,
    monthlyGoal: monthlyGoal,
    type: 'spending',
    isImmutable: false,
    planId,
  });
};

const updateCategory = async ({ categoryId, name, monthlyGoal, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new UpdateCategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    categoryId,
    name,
    monthlyGoal,
    planId,
  });
};

const deleteCategory = async ({ categoryId, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new DeleteCategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    categoryId,
    planId,
  });
};

const createSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlyGoal,
  planId,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new CreateSubcategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlyGoal,
    isImmutable: false,
    type: 'spending',
    transactions: [],
    planId,
  });
};

const updateSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlyGoal,
  planId,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new UpdateSubcategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlyGoal,
    planId,
  });
};

const deleteSubcategory = async ({ subcategoryId, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new DeleteSubcategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    subcategoryId,
    planId,
  });
};

export {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
