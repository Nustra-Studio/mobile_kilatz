import { getDB } from '../database/db';

export type Room = {
    id: number;
    name: string;
    type: string;
    hourly_rate: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    tv_ip_address?: string;
    capacity?: number;
};

export type RoomSession = {
    id: number;
    room_id: number;
    start_time: string;
    end_time?: string;
    total_cost?: number;
    status: 'ACTIVE' | 'COMPLETED';

};

export const RoomModel = {
    async getAllRooms(): Promise<Room[]> {
        const db = await getDB();
        return await db.getAllAsync<Room>('SELECT * FROM rooms');
    },

    async addRoom(room: Omit<Room, 'id' | 'status'>) {
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO rooms (name, type, hourly_rate, tv_ip_address, capacity, status) VALUES (?, ?, ?, ?, ?, ?)',
            [room.name, room.type || 'REGULAR', room.hourly_rate, room.tv_ip_address || null, room.capacity || 0, 'AVAILABLE']
        );
        return result.lastInsertRowId;
    },

    async updateRoom(id: number, room: Partial<Room>) {
        const db = await getDB();
        const sets: string[] = [];
        const params: any[] = [];

        if (room.name !== undefined) { sets.push('name = ?'); params.push(room.name); }
        if (room.type !== undefined) { sets.push('type = ?'); params.push(room.type); }
        if (room.hourly_rate !== undefined) { sets.push('hourly_rate = ?'); params.push(room.hourly_rate); }
        if (room.tv_ip_address !== undefined) { sets.push('tv_ip_address = ?'); params.push(room.tv_ip_address); }
        if (room.capacity !== undefined) { sets.push('capacity = ?'); params.push(room.capacity); }
        if (room.status !== undefined) { sets.push('status = ?'); params.push(room.status); }

        if (sets.length === 0) return;

        params.push(id);
        await db.runAsync(`UPDATE rooms SET ${sets.join(', ')} WHERE id = ?`, params);
    },

    async deleteRoom(id: number) {
        const db = await getDB();
        await db.runAsync('DELETE FROM rooms WHERE id = ?', [id]);
    },

    async updateRoomStatus(id: number, status: string) {
        const db = await getDB();
        await db.runAsync('UPDATE rooms SET status = ? WHERE id = ?', [status, id]);
    },

    async startSession(roomId: number) {
        await this.updateRoomStatus(roomId, 'OCCUPIED');
        const db = await getDB();
        const result = await db.runAsync(
            'INSERT INTO room_sessions (room_id, start_time, status) VALUES (?, ?, ?)',
            [roomId, new Date().toISOString(), 'ACTIVE']
        );
        return result.lastInsertRowId;
    },

    async endSession(sessionId: number, totalCost: number) {
        const db = await getDB();
        const session = await db.getFirstAsync<{ room_id: number }>('SELECT room_id FROM room_sessions WHERE id = ?', [sessionId]);

        await db.runAsync(
            'UPDATE room_sessions SET end_time = ?, total_cost = ?, status = ? WHERE id = ?',
            [new Date().toISOString(), totalCost, 'COMPLETED', sessionId]
        );

        if (session) {
            await this.updateRoomStatus(session.room_id, 'AVAILABLE');
        }
    },

    async getActiveSession(roomId: number): Promise<RoomSession | null> {
        const db = await getDB();
        return await db.getFirstAsync<RoomSession>(
            'SELECT * FROM room_sessions WHERE room_id = ? AND status = ?',
            [roomId, 'ACTIVE']
        );
    },

    async migrateRoomsTable(): Promise<void> {
        const db = await getDB();
        try {
            await db.runAsync(`ALTER TABLE rooms ADD COLUMN tv_ip_address TEXT`);
            console.log('[RoomModel] Migration: added tv_ip_address column.');
        } catch (e) { /* ignore if already exists */ }

        try {
            await db.runAsync(`ALTER TABLE rooms ADD COLUMN capacity INTEGER DEFAULT 0`);
            console.log('[RoomModel] Migration: added capacity column.');
        } catch (e) { /* ignore if already exists */ }
    }
};
