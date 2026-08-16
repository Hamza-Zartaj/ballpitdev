import db from "../models/db";
import { firestore } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const notificationController = {
    // Create a new notification
    createNotification: async (notificationData) => {
        try {
            return await db.notifications.create(notificationData);
        } catch (error) {
            throw new Error(`Error creating notification: ${error.message}`);
        }
    },

    // Get all notifications for a specific user
    getNotifications: async (userId) => {
        try {
            const notifications = await db.notifications.getByReceiver(userId);

            // Fetch user details for sender where type = true (user notification)
            const notificationsWithSenderDetails = await Promise.all(
                notifications.map(async (notification) => {
                    if (notification.type) {
                        const sender = await db.users.getByUid(notification.sender);
                        return {
                            ...notification,
                            sender: sender || null,
                        };
                    } else {
                        return { ...notification, sender: "" };
                    }
                })
            );

            return notificationsWithSenderDetails;
        } catch (error) {
            throw new Error(`Error retrieving notifications: ${error.message}`);
        }
    },

    updateNotification: async (userId, updateData) => {
        try {
            await db.notifications.markAllRead(userId);
            return { message: "Notifications updated" };
        } catch (error) {
            throw new Error(`Error updating Notification: ${error.message}`);
        }
    },
};

export default notificationController;