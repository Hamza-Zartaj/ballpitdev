// app/api/users/persona/route.js

import userController from "@/app/controllers/userController";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/app/config/firebase";

export const GET = async (req) => {
  try {
    const urlObj = new URL(req.url);
    const id = urlObj.searchParams.get("id"); // e.g. "demo-guest-12345" or "realUserId"

    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── If the ID starts with "demo-guest-", force-enable persona here ───
    if (id.startsWith("demo-guest-")) {
      // Return a default personaSetting for any demo user.
      return new Response(
        JSON.stringify({
          personality: "friendly",   // or whichever default you prefer
          extraPrompt: "",
          name: "",
          shareImage: false,
          images: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ─── Otherwise, proceed with your existing “real user” logic ───

    // Try main users collection first
    try {
      const mainUser = await userController.getUser(id);
      const personaSetting = mainUser?.personaSetting || {};

      return new Response(
        JSON.stringify(personaSetting),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch {
      // If not found in main users, do nothing here; we’ll fall back below
    }

    // Fallback to demoUsers/{stripped} only if it truly exists
    const stripped = id.replace(/^demo-/, ""); // yields "guest-12345"
    const demoSnap = await getDoc(doc(firestore, "demoUsers", stripped));
    if (!demoSnap.exists()) {
      return new Response(JSON.stringify({}), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const demoData = demoSnap.data();
    return new Response(
      JSON.stringify(demoData.personaSetting || {}),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Error in GET /api/users/persona:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST = async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");    // e.g. "guest-12345" or "abcUserId"
    const data = await req.json();             // the new personaSetting object

    if (!id) {
      return new Response(JSON.stringify({ error: "Query param `id` is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Demo user branch ───
    if (id.startsWith("guest-")) {
      const demoRef = doc(firestore, "demoUsers", id);
      const snapshot = await getDoc(demoRef);

      if (!snapshot.exists()) {
        return new Response(JSON.stringify({ error: "Demo user not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Update just the personaSetting field
      await updateDoc(demoRef, { personaSetting: data });

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Regular user branch ───
    try {
      await userController.updateUser(id, { personaSetting: data });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error updating user persona:", err);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

  } catch (e) {
    console.error("Error in POST /api/users/persona/test:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
