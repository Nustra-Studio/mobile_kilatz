import { ProductModel, Product } from '../models/ProductModel';

export const ProductController = {
    async getProducts(): Promise<Product[]> {
        return await ProductModel.getAllProducts();
    },

    async saveProduct(product: Partial<Product>) {
        // Validation logic here
        if (!product.name || product.price === undefined) {
            throw new Error('Name and Price are required');
        }

        if (product.id) {
            await ProductModel.updateProduct(product.id, product);
        } else {
            await ProductModel.addProduct(product as any);
        }
    },

    async deleteProduct(id: number) {
        await ProductModel.deleteProduct(id);
    }
};
