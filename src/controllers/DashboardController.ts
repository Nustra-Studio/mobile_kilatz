import { getDB } from '../database/db';

export const DashboardController = {
  /**
   * Get overall summary for the dashboard cards
   */
  async getSummary() {
    try {
      const db = await getDB();
      
      // 1. Total Sales Today (Local Time)
      const salesResult = await db.getFirstAsync<{ total: number }>(
        "SELECT SUM(total_amount) as total FROM orders WHERE date(created_at) = date('now', 'localtime')"
      );
      
      // 2. Transaction Count Today
      const countResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now', 'localtime')"
      );
      
      // 3. Low Stock Count (Threshold < 5)
      const lowStockResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM products WHERE stock < 5 AND is_active = 1"
      );
      
      // 4. Active Rooms / Total Rooms
      const activeRoomsResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM rooms WHERE status = 'OCCUPIED'"
      );
      const totalRoomsResult = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM rooms"
      );

      return {
        totalSales: salesResult?.total || 0,
        transactionCount: countResult?.count || 0,
        lowStockCount: lowStockResult?.count || 0,
        activeRooms: activeRoomsResult?.count || 0,
        totalRooms: totalRoomsResult?.count || 0,
      };
    } catch (error) {
      console.error('[DashboardController] Error getting summary:', error);
      return {
        totalSales: 0,
        transactionCount: 0,
        lowStockCount: 0,
        activeRooms: 0,
        totalRooms: 0,
      };
    }
  },

  /**
   * Get list of recent transactions
   */
  async getRecentTransactions(limit = 3) {
    try {
      const db = await getDB();
      // We join with users to get cashier name, and order_items to count items if needed
      // For now keep it simple as per UI needs
      return await db.getAllAsync<any>(
        `SELECT o.*, 
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
         FROM orders o 
         ORDER BY o.created_at DESC 
         LIMIT ?`,
        [limit]
      );
    } catch (error) {
      console.error('[DashboardController] Error getting recent transactions:', error);
      return [];
    }
  }
};
