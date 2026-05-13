import { OrderModel, Order, OrderItem } from '../models/OrderModel';
import { getDB } from '../database/db';
import { SyncController, TransactionSyncStatus } from './SyncController';

export const TransactionController = {

    /**
     * Process a transaction:
     * 1. Save to SQLite immediately (offline-first, synced=0)
     * 2. Try upload to API within 3 seconds
     * 3. If upload succeeds → mark synced=1
     * 4. If upload fails/timeout → stays as synced=0 (will retry in background)
     * 
     * Returns { invoiceNumber, syncStatus }
     */
    async processTransaction(
        items: Omit<OrderItem, 'id' | 'order_id'>[],
        paymentMethod: 'CASH' | 'QRIS' | 'DEBIT',
        totalAmount: number,
        cashierId?: number
    ): Promise<{ invoiceNumber: string; syncStatus: TransactionSyncStatus }> {

        if (items.length === 0) {
            throw new Error('Cart is empty');
        }

        const invoiceNumber = `INV-${Date.now()}`;

        // Step 1: Save to local SQLite immediately (with synced=0)
        const db = await getDB();
        const result = await db.runAsync(
            `INSERT INTO orders (invoice_number, total_amount, payment_method, cashier_id, synced)
             VALUES (?, ?, ?, ?, 0)`,
            [invoiceNumber, totalAmount, paymentMethod, cashierId ?? null]
        );
        const orderId = result.lastInsertRowId;

        // Insert items and update stock
        for (const item of items) {
            await db.runAsync(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
            );
            await db.runAsync(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        // Step 2: Try upload to server (max 3 seconds)
        const syncStatus = await SyncController.tryUploadTransaction({
            orderId,
            invoiceNumber,
            totalAmount,
            paymentMethod,
            cashierId,
            items,
        });

        return { invoiceNumber, syncStatus };
    },

    async getTransactionHistory(): Promise<Order[]> {
        return await OrderModel.getOrders();
    },

    async getPendingSyncCount(): Promise<number> {
        return await SyncController.getPendingCount();
    }
};
