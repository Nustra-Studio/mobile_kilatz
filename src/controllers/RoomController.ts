// src/controllers/RoomController.ts
import { Room, RoomModel } from '../models/RoomModel';
import { TvControlService } from '@/src/utils/TvControlService';

export const RoomController = {
    async getRooms(): Promise<Room[]> {
        // Run migration just in case (safe)
        await RoomModel.migrateRoomsTable().catch(() => {});
        return await RoomModel.getAllRooms();
    },

    async addRoom(roomData: Partial<Room>) {
        return await RoomModel.addRoom({
            name: roomData.name || 'Unnamed Room',
            type: roomData.type || 'REGULAR',
            hourly_rate: roomData.hourly_rate || 0,
            tv_ip_address: roomData.tv_ip_address,
            capacity: roomData.capacity || 0,
        });
    },

    async updateRoom(id: number, roomData: Partial<Room>) {
        return await RoomModel.updateRoom(id, roomData);
    },

    async deleteRoom(id: number) {
        return await RoomModel.deleteRoom(id);
    },

    // Tambahkan parameter durationMinutes dan tvIpAddress
    async startSession(roomId: number, durationMinutes?: number, tvIpAddress?: string) {
        // 1. Simpan ke database lokal
        const sessionId = await RoomModel.startSession(roomId);

        // 2. Tembak command ke TV LG WebOS
        if (tvIpAddress) {
            try {
                // Jika ada durasi berarti paket, jika tidak berarti open billing
                const action = durationMinutes ? 'start_paket' : 'open';
                await TvControlService.sendCommand(tvIpAddress, action, durationMinutes);
            } catch (error) {
                console.error("Warning: DB sukses tapi TV gagal dihidupkan.", error);
                // Kamu bisa melempar error ini ke UI untuk memunculkan Toast Alert
            }
        }

        return sessionId;
    },

    async stopSession(sessionId: number, totalCost: number, tvIpAddress?: string) {
        // 1. Selesaikan sesi di database lokal
        await RoomModel.endSession(sessionId, totalCost);

        // 2. Tembak command Lock Screen (Close) ke TV
        if (tvIpAddress) {
            try {
                await TvControlService.sendCommand(tvIpAddress, 'close');
            } catch (error) {
                console.error("Warning: Gagal mengunci layar TV.", error);
            }
        }
    },

    async getActiveSession(roomId: number) {
        return await RoomModel.getActiveSession(roomId);
    }
};