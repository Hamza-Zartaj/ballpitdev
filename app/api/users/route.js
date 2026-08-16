// app/api/users/route.js
import userController from "../../controllers/userController";

export const GET = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (id == "all") {
      // If no ID is provided, get all users
      const users = await userController.getAllUsers();
      return new Response(JSON.stringify(users), { status: 200 });
    } else if (id) {
      // If an ID is provided, get a specific user
      const user = await userController.getUser(id);
      return new Response(JSON.stringify(user), { status: 200 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
    });
  }
};

export const POST = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  try {
    const userData = await req.json(); // Parse the JSON body for user data
    const userId = await userController.createUser(userData, id); // Create a new user
    return new Response(JSON.stringify({ id: userId }), { status: 201 }); // Return the ID of the created user
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    }); // Handle errors
  }
};

export const PUT = async (req) => {
  const url = new URL(req.url); // Create a URL object from the request URL
  const id = url.searchParams.get("id"); // Get the ID from the query parameters

  try {
    let updateData = await req.json(); // Parse the JSON body for updated user data

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      }); // Handle missing ID
    }

    
    
    const updatedUser = await userController.updateUser(id, updateData); // Call the controller to update the user
    
    
    
    return new Response(JSON.stringify(updatedUser), { status: 200 }); // Return the updated user data
  } catch (error) {
    console.error(`[API] Update error for user ${id}:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    }); // Handle errors
  }
};

export const DELETE = async (req) => {
  const url = new URL(req.url); // Create a URL object from the request URL
  const id = url.searchParams.get("id"); // Get the ID from the query parameters

  try {
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
      }); // Handle missing ID
    }

    const result = await userController.deleteUser(id); // Call the controller to delete the user
    return new Response(JSON.stringify(result), { status: 200 }); // Return success message
  } catch (error) {
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    }); // Handle errors
  }
};
