import { getDB } from '../database/db';

export type Order = {
    id: number;
    invoice_number: string;
    total_amount: number;
    payment_method: 'CASH' | 'QRIS' | 'DEBIT';
    cashier_id?: number;
    created_at: string;
    status: 'COMPLETED' | 'CANCELLED';
    items?: OrderItem[];
};

export type OrderItem = {
    id: number;
    product_id: number;
    product_name?: string; // transient/joined
    quantity: number;
    unit_price: number;
    subtotal: number;
};

export const OrderModel = {
    async createOrder(order: Omit<Order, 'id' | 'created_at' | 'status'>, items: Omit<OrderItem, 'id' | 'order_id'>[]) {
        const db = await getDB();
        try {
            // 1. Create Order
            const result = await db.runAsync(
                'INSERT INTO orders (invoice_number, total_amount, payment_method, cashier_id) VALUES (?, ?, ?, ?)',
                [order.invoice_number, order.total_amount, order.payment_method, order.cashier_id ?? null]
            );
            const orderId = result.lastInsertRowId;

            // 2. Create Order Items and Update Stock
            for (const item of items) {
                await db.runAsync(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
                );

                // Update Stock
                await db.runAsync(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
            return orderId;
        } catch (e) {
            console.error('Transactions failed', e);
            throw e;
        }
    },

    async getOrders(): Promise<Order[]> {
        const db = await getDB();
        return await db.getAllAsync<Order>('SELECT * FROM orders ORDER BY created_at DESC');
    },

    async getOrderItems(orderId: number): Promise<OrderItem[]> {
        const db = await getDB();
        return await db.getAllAsync<OrderItem>(
            `SELECT oi.*, p.name as product_name 
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?`,
            [orderId]
        );
    }
};
