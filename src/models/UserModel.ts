import { getDB } from '../database/db';

export type User = {
    id: number;
    name: string;
    username: string;
    role: 'CASHIER' | 'SUPERVISOR' | 'OWNER';
    pin?: string;
};

export const UserModel = {
    async getAllUsers(): Promise<User[]> {
        const db = await getDB();
        const result = await db.getAllAsync<User>('SELECT id, name, username, role, pin FROM users');
        return result;
    },

    async createUser(user: Omit<User, 'id'> & { password_hash: string }) {
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO users (name, username, password_hash, role, pin) VALUES (?, ?, ?, ?, ?)',
            [user.name, user.username, user.password_hash, user.role, user.pin ?? null]
        );
        return result.lastInsertRowId;
    },

    async findByUsername(username: string): Promise<User & { password_hash: string } | null> {
        const db = await getDB();
        const result = await db.getAllAsync<User & { password_hash: string }>(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return result[0] || null;
    }
};
