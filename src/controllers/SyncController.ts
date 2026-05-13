/**
 * SyncController.ts
 *
 * Handles all sync logic between SQLite (local) and REST API (server):
 *
 * Flow:
 *  1. TRANSACTION  → simpan lokal dulu, coba upload 3 detik, jika gagal → synced=0 (belum sinkron)
 *  2. BACKGROUND   → setInterval setiap 5 menit, push semua synced=0 ke server
 *  3. LOGIN        → pull data master (products, categories) dari server ke lokal
 *  4. LOGOUT       → flush push semua synced=0 sebelum keluar
 */

import { api } from '../utils/api';
import { getDB } from '../database/db';
import { NotificationController } from './NotificationController';

// ── Interval handle untuk background sync ────────────────────────────────────
let _backgroundIntervalId: ReturnType<typeof setInterval> | null = null;

// Interval default: 5 menit (300_000 ms)
const BACKGROUND_INTERVAL_MS = 5 * 60 * 1000;

// ── Types ─────────────────────────────────────────────────────────────────────

export type TransactionSyncStatus = 'synced' | 'pending' | 'error';

export interface PendingCount {
    count: number;
}

// ── Main Controller ───────────────────────────────────────────────────────────

export const SyncController = {

    // ── 1. TRY-UPLOAD satu transaksi (dipanggil dari TransactionController) ──

    /**
     * Coba upload transaksi ke server dalam 3 detik.
     * Return 'synced' kalau berhasil, 'pending' kalau gagal/timeout.
     * Caller tetap harus sudah menyimpan order ke SQLite terlebih dahulu.
     */
    async tryUploadTransaction(params: {
        orderId: number;
        invoiceNumber: string;
        totalAmount: number;
        paymentMethod: string;
        cashierId?: number;
        items: Array<{
            product_id: number;
            quantity: number;
            unit_price: number;
            subtotal: number;
        }>;
    }): Promise<TransactionSyncStatus> {
        try {
            await api.postWithTimeout('/v1/transactions', {
                invoice_number: params.invoiceNumber,
                total_amount: params.totalAmount,
                payment_method: params.paymentMethod,
                cashier_id: params.cashierId ?? null,
                items: params.items,
            }, 3000);

            // Tandai sebagai sudah sinkron
            const db = await getDB();
            await db.runAsync('UPDATE orders SET synced = 1 WHERE id = ?', [params.orderId]);

            console.log(`[Sync] ✅ Transaction ${params.invoiceNumber} uploaded.`);
            return 'synced';

        } catch (err: any) {
            const reason = err.message === 'TIMEOUT' ? 'Timeout 3s' : err.message;
            console.warn(`[Sync] ⚠️ Transaction ${params.invoiceNumber} pending — ${reason}`);
            // SQLite sudah tersimpan dengan synced=0, tidak perlu update lagi
            return 'pending';
        }
    },

    // ── 2. PUSH semua pending transaksi ke server ─────────────────────────────

    async pushPendingTransactions(): Promise<{ pushed: number; failed: number }> {
        const db = await getDB();

        const pending = await db.getAllAsync<any>(
            `SELECT * FROM orders WHERE synced = 0 ORDER BY created_at ASC`
        );

        if (pending.length === 0) {
            console.log('[Sync] 🔵 No pending transactions.');
            return { pushed: 0, failed: 0 };
        }

        console.log(`[Sync] 🔄 Pushing ${pending.length} pending transaction(s)...`);

        let pushed = 0;
        let failed = 0;

        for (const order of pending) {
            try {
                const items = await db.getAllAsync<any>(
                    `SELECT * FROM order_items WHERE order_id = ?`, [order.id]
                );

                await api.postWithTimeout('/v1/transactions', {
                    invoice_number: order.invoice_number,
                    total_amount: order.total_amount,
                    payment_method: order.payment_method,
                    cashier_id: order.cashier_id ?? null,
                    items: items.map((i: any) => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                        unit_price: i.unit_price,
                        subtotal: i.subtotal,
                    })),
                }, 5000); // 5 detik untuk background (lebih toleran)

                await db.runAsync('UPDATE orders SET synced = 1 WHERE id = ?', [order.id]);
                pushed++;
                console.log(`[Sync] ✅ Pushed ${order.invoice_number}`);

            } catch (err: any) {
                failed++;
                console.warn(`[Sync] ⚠️ Failed to push ${order.invoice_number}: ${err.message}`);
                NotificationController.add({
                    title: 'Sync Gagal',
                    message: `Gagal mengirim transaksi ${order.invoice_number}. Silakan cek koneksi.`,
                    type: 'SYNC'
                });
            }
        }

        console.log(`[Sync] Done — pushed: ${pushed}, still pending: ${failed}`);
        return { pushed, failed };
    },

    // ── 3. PULL master data dari server ke SQLite ─────────────────────────────

    async pullProducts(): Promise<number> {
        const data = await api.get('/v1/products');
        const products: any[] = data?.data ?? [];
        const db = await getDB();

        for (const p of products) {
            const existing = await db.getFirstAsync<{ id: number }>(
                'SELECT id FROM products WHERE id = ?', [p.id]
            );
            if (existing) {
                await db.runAsync(
                    `UPDATE products SET name=?, sku=?, price=?, stock=?, category=?, image_uri=?, is_active=? WHERE id=?`,
                    [p.name, p.sku ?? null, p.price, p.stock ?? 0, p.category ?? null, p.image_uri ?? null, p.is_active ?? 1, p.id]
                );
            } else {
                await db.runAsync(
                    `INSERT INTO products (id, name, sku, price, stock, category, image_uri, is_active) VALUES (?,?,?,?,?,?,?,?)`,
                    [p.id, p.name, p.sku ?? null, p.price, p.stock ?? 0, p.category ?? null, p.image_uri ?? null, p.is_active ?? 1]
                );
            }
        }
        console.log(`[Sync] ⬇️  Pulled ${products.length} products.`);
        return products.length;
    },

    async pullCategories(): Promise<number> {
        const data = await api.get('/v1/categories');
        const categories: any[] = data?.data ?? [];
        const db = await getDB();

        for (const c of categories) {
            const existing = await db.getFirstAsync<{ id: number }>(
                'SELECT id FROM categories WHERE id = ?', [c.id]
            );
            if (existing) {
                await db.runAsync(
                    `UPDATE categories SET name=?, type=?, icon=? WHERE id=?`,
                    [c.name, c.type ?? 'OTHER', c.icon ?? null, c.id]
                );
            } else {
                await db.runAsync(
                    `INSERT INTO categories (id, name, type, icon) VALUES (?,?,?,?)`,
                    [c.id, c.name, c.type ?? 'OTHER', c.icon ?? null]
                );
            }
        }
        console.log(`[Sync] ⬇️  Pulled ${categories.length} categories.`);
        return categories.length;
    },

    // ── 4. ON-LOGIN sync ──────────────────────────────────────────────────────

    /** Dipanggil setelah login berhasil. Pull data terbaru dari server. */
    async onLoginSync(): Promise<void> {
        console.log('[Sync] 🚀 Running on-login sync...');
        await this.migrateAddSyncedColumn();
        try {
            await Promise.all([
                this.pullProducts(),
                this.pullCategories(),
            ]);
        } catch (err: any) {
            console.warn('[Sync] On-login pull failed (offline?):', err);
            NotificationController.add({
                title: 'Koneksi Server Gagal',
                message: 'Gagal mengambil data produk terbaru dari server.',
                type: 'SYNC'
            });
        }
        // Juga coba push pending yang mungkin tersisa dari sesi sebelumnya
        await this.pushPendingTransactions().catch(() => {});
        console.log('[Sync] ✅ On-login sync complete.');
    },

    // ── 5. ON-LOGOUT / CLOSE KASIR sync ──────────────────────────────────────

    /** Dipanggil sebelum logout. Flush semua pending transaksi ke server. */
    async onLogoutSync(): Promise<{ pushed: number; failed: number }> {
        console.log('[Sync] 🔒 Running pre-logout sync...');
        this.stopBackgroundSync(); // Hentikan interval dulu
        const result = await this.pushPendingTransactions();
        console.log(`[Sync] Pre-logout done. Pushed: ${result.pushed}, failed: ${result.failed}`);
        return result;
    },

    // ── 6. BACKGROUND INTERVAL sync ──────────────────────────────────────────

    startBackgroundSync(intervalMs: number = BACKGROUND_INTERVAL_MS): void {
        if (_backgroundIntervalId) {
            console.log('[Sync] Background sync already running.');
            return;
        }
        console.log(`[Sync] ⏰ Background sync started (every ${intervalMs / 60000} min)`);
        _backgroundIntervalId = setInterval(async () => {
            console.log('[Sync] ⏰ Background sync tick...');
            await this.pushPendingTransactions().catch(err =>
                console.warn('[Sync] Background push error:', err)
            );
        }, intervalMs);
    },

    stopBackgroundSync(): void {
        if (_backgroundIntervalId) {
            clearInterval(_backgroundIntervalId);
            _backgroundIntervalId = null;
            console.log('[Sync] ⏹️  Background sync stopped.');
        }
    },

    // ── 7. Utils ──────────────────────────────────────────────────────────────

    async getPendingCount(): Promise<number> {
        const db = await getDB();
        const row = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM orders WHERE synced = 0'
        );
        return row?.count ?? 0;
    },

    /** Jalankan migrasi kolom synced jika belum ada (safe to call multiple times) */
    async migrateAddSyncedColumn(): Promise<void> {
        const db = await getDB();
        try {
            await db.runAsync(`ALTER TABLE orders ADD COLUMN synced INTEGER DEFAULT 0`);
            console.log('[Sync] Migration: added synced column.');
        } catch {
            // Kolom sudah ada — normal
        }
    },
};
