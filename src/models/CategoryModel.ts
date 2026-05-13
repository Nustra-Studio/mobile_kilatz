import { getDB } from '../database/db';

export type Category = {
    id: number;
    name: string;
    type: 'FOOD' | 'DRINK' | 'SNACK' | 'KARAOKE' | 'OTHER';
    icon?: string;
};

export const CategoryModel = {
    async getAllCategories(): Promise<Category[]> {
        const db = await getDB();
        return await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
    },

    async addCategory(category: Omit<Category, 'id'>) {
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO categories (name, type, icon) VALUES (?, ?, ?)',
            [category.name, category.type, category.icon ?? null]
        );
        return result.lastInsertRowId;
    },

    async updateCategory(id: number, category: Partial<Category>) {
        const db = await getDB();
        const fields = [];
        const values = [];

        if (category.name !== undefined) { fields.push('name = ?'); values.push(category.name); }
        if (category.type !== undefined) { fields.push('type = ?'); values.push(category.type); }
        if (category.icon !== undefined) { fields.push('icon = ?'); values.push(category.icon); }

        if (fields.length === 0) return;
        values.push(id);

        await db.runAsync(
            `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },

    async deleteCategory(id: number) {
        const db = await getDB();
        return await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    }
};
