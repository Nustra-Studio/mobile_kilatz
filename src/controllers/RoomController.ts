import { RoomModel, Room } from '../models/RoomModel';

export const RoomController = {
    async getRooms(): Promise<Room[]> {
        return await RoomModel.getAllRooms();
    },

    async startSession(roomId: number) {
        return await RoomModel.startSession(roomId);
    },

    async stopSession(sessionId: number, totalCost: number) {
        return await RoomModel.endSession(sessionId, totalCost);
    },

    async getActiveSession(roomId: number) {
        return await RoomModel.getActiveSession(roomId);
    }
};
