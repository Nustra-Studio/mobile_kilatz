import { getDB } from '../database/db';

export type Room = {
    id: number;
    name: string;
    type: string;
    hourly_rate: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
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
            'INSERT INTO rooms (name, type, hourly_rate, status) VALUES (?, ?, ?, ?)',
            [room.name, room.type, room.hourly_rate, 'AVAILABLE']
        );
        return result.lastInsertRowId;
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
    }
};
