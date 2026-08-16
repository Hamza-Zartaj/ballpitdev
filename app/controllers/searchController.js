import db from "../models/db";

const searchController = {

    // Search users by name
    search: async (searchTerm) => {
        try {
            const allUsers = await db.users.getAll();
            return allUsers.filter(
                (user) => user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } catch (error) {
            throw new Error(`Error searching users: ${error.message}`);
        }
    },

};

export default searchController;