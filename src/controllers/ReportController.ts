import { getDB } from '../database/db';

export const ReportController = {
    async getDailyStats() {
        const db = await getDB();
        // Get total sales for today
        const today = new Date().toISOString().split('T')[0];
        const result = await db.getFirstAsync<{ total: number; count: number }>(
            `SELECT SUM(total_amount) as total, COUNT(*) as count 
       FROM orders 
       WHERE date(created_at) = date('now', 'localtime')` // simplified date check
        );

        return {
            totalSales: result?.total || 0,
            transactionCount: result?.count || 0
        };
    },

    async getTopProducts() {
        const db = await getDB();
        return await db.getAllAsync(
            `SELECT p.name, SUM(oi.quantity) as quantity, SUM(oi.subtotal) as total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY p.id
       ORDER BY quantity DESC
       LIMIT 5`
        );
    }
};
