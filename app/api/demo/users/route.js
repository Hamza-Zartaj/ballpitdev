// app/api/demo/users/route.js

import demoUserController from "@/app/controllers/demoUserController";

/**
 * GET /api/demo/users?id=<uid or “all”>
 *  - If id="all", return all demo users
 *  - If id=<uid>, return that specific demo user
 */
export const GET = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (id === "all") {
      const users = await demoUserController.getAllDemoUsers();
      return new Response(JSON.stringify(users), { status: 200 });
    } else if (id) {
      const user = await demoUserController.getDemoUser(id);
      return new Response(JSON.stringify(user), { status: 200 });
    } else {
      return new Response(
        JSON.stringify({ error: "Query param 'id' is required" }),
        { status: 400 }
      );
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message.includes("not found") ? 404 : 500,
    });
  }
};

/**
 * POST /api/demo/users?id=<optional uid>
 *  - Body should be JSON: { name, avatar?, personaSetting? }
 *  - If you include ?id=guest-12345, the demo user will be forced to that UID.
 *    Otherwise, Firestore generates a new random doc ID for you.
 *  - Returns: { id: "<new-uid>" }
 */
export const POST = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id"); // optional

  try {
    const userData = await req.json();
    const newUid = await demoUserController.createDemoUser(userData, id);
    return new Response(JSON.stringify({ id: newUid }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
};

/**
 * PUT /api/demo/users?id=<uid>
 *  - Body is JSON of fields to update (e.g. { name: "New Name" })
 *  - Returns the updated fields
 */
export const PUT = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Query param 'id' is required" }),
      { status: 400 }
    );
  }

  try {
    const updateData = await req.json();
    const updated = await demoUserController.updateDemoUser(id, updateData);
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
};

/**
 * DELETE /api/demo/users?id=<uid>
 *  - Deletes the demo user document with that UID.
 */
export const DELETE = async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Query param 'id' is required" }),
      { status: 400 }
    );
  }

  try {
    const result = await demoUserController.deleteDemoUser(id);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
};
