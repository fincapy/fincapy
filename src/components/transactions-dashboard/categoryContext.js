import { createContext } from 'react';
import { Subcategory } from '@/backend/domain/subcategory';

const CategoryContext = createContext();

const deleteSubcategoryState = async ({
  subcategoryId,
  subcategoriesState,
  setSubcategoriesState,
  setPreviousState,
  setAreSubcategoriesOpen,
}) => {
  const subcategories = [...subcategoriesState];
  const newSubcategories = subcategories.filter(
    (s) => s.subcategoryId !== subcategoryId
  );
  setSubcategoriesState(newSubcategories);
  setPreviousState(subcategoriesState);
  if (newSubcategories.length === 0) {
    setAreSubcategoriesOpen(false);
  }
};

const createCategoryState = async ({
  categoryId,
  name,
  monthlyGoal,
  type,
  categoriesState,
  setCategoriesState,
  setPreviousState,
}) => {
  setCategoriesState(newCategories);
  setPreviousState(categoriesState);
};

export { CategoryContext, deleteSubcategoryState, createCategoryState };
