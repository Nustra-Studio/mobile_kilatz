/**
 * NotificationController.ts
 * 
 * Global store and logic for in-app notifications.
 */

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'STOCK' | 'SYNC' | 'SYSTEM' | 'ORDER';
}

type Listener = (notifs: Notification[]) => void;

let notifications: Notification[] = [
    // Initial mock data if needed, or start empty
    { id: '1', title: 'System', message: 'Aplikasi Kilatz siap digunakan.', time: 'Just now', read: false, type: 'SYSTEM' },
];

let listeners: Listener[] = [];

export const NotificationController = {
    /**
     * Get all current notifications
     */
    getNotifications(): Notification[] {
        return notifications;
    },

    /**
     * Add a new notification to the list
     */
    add(notif: Omit<Notification, 'id' | 'time' | 'read'>) {
        const newNotif: Notification = {
            ...notif,
            id: Math.random().toString(36).substring(7),
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            read: false,
        };
        
        notifications = [newNotif, ...notifications].slice(0, 50); // Keep last 50
        this.notify();
    },

    /**
     * Clear all notifications from the list
     */
    clearAll() {
        notifications = [];
        this.notify();
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead() {
        notifications = notifications.map(n => ({ ...n, read: true }));
        this.notify();
    },

    /**
     * Subscribe to notification changes
     */
    subscribe(listener: Listener) {
        listeners.push(listener);
        // Initial notify
        listener(notifications);
        
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    /**
     * Notify all listeners
     */
    notify() {
        listeners.forEach(l => l(notifications));
    }
};
