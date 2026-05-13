import { getDB } from '../database/db';

export type Product = {
    id: number;
    name: string;
    sku?: string;
    price: number;
    stock: number;
    category?: string;
    image_uri?: string;
    is_active: number; // 0 or 1
};

export const ProductModel = {
    async getAllProducts(): Promise<Product[]> {
        const db = await getDB();
        return await db.getAllAsync<Product>('SELECT * FROM products ORDER BY name ASC');
    },

    async addProduct(product: Omit<Product, 'id'>) {
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO products (name, sku, price, stock, category, image_uri, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [product.name, product.sku ?? null, product.price, product.stock, product.category ?? null, product.image_uri ?? null, product.is_active]
        );
        return result.lastInsertRowId;
    },

    async updateProduct(id: number, product: Partial<Product>) {
        const db = await getDB();
        // Build dynamic query
        const fields = [];
        const values = [];

        if (product.name !== undefined) { fields.push('name = ?'); values.push(product.name); }
        if (product.sku !== undefined) { fields.push('sku = ?'); values.push(product.sku); }
        if (product.price !== undefined) { fields.push('price = ?'); values.push(product.price); }
        if (product.stock !== undefined) { fields.push('stock = ?'); values.push(product.stock); }
        if (product.category !== undefined) { fields.push('category = ?'); values.push(product.category); }
        if (product.image_uri !== undefined) { fields.push('image_uri = ?'); values.push(product.image_uri); }
        if (product.is_active !== undefined) { fields.push('is_active = ?'); values.push(product.is_active); }

        if (fields.length === 0) return;

        values.push(id);

        await db.runAsync(
            `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },

    async deleteProduct(id: number) {
        const db = await getDB();
        const result = await db.runAsync('UPDATE products SET is_active = 0 WHERE id = ?', [id]); // Soft delete preferred
        return result;
    }
};
