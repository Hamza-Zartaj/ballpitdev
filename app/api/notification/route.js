// app/api/notifications/route.js
import notificationController from '../../controllers/notificationController';

export const GET = async (req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get('id'); // Get the user ID from the query parameters

    try {
        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
        }

        const notifications = await notificationController.getNotifications(userId); // Get notifications for the user
        return new Response(JSON.stringify(notifications), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

export const POST = async (req) => {
    try {
        const notificationData = await req.json(); // Parse the JSON body for notification data
        const notificationId = await notificationController.createNotification(notificationData); // Create a new notification
        return new Response(JSON.stringify({ id: notificationId }), { status: 201 }); // Return the ID of the created notification
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 }); // Handle errors
    }
};

export const PUT = async (req) => {
    const url = new URL(req.url); // Create a URL object from the request URL
    const id = url.searchParams.get('id'); 

    try {
        let updateData = await req.json();

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 }); // Handle missing ID
        }

        const updatedData = await notificationController.updateNotification(id, updateData); // Call the controller to update the gift
        return new Response(JSON.stringify(updatedData), { status: 200 }); // Return the updated gift data
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 }); // Handle errors
    }

}