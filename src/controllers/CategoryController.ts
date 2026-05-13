import { CategoryModel, Category } from '../models/CategoryModel';

export const CategoryController = {
    async getCategories() {
        return await CategoryModel.getAllCategories();
    },

    async addCategory(name: string, type: Category['type'], icon?: string) {
        if (!name) throw new Error('Name is required');
        return await CategoryModel.addCategory({ name, type, icon });
    },

    async updateCategory(id: number, data: Partial<Category>) {
        return await CategoryModel.updateCategory(id, data);
    },

    async deleteCategory(id: number) {
        return await CategoryModel.deleteCategory(id);
    }
};
