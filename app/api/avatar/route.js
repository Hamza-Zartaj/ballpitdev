const portfolioMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

export const GET = async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id"); // e.g. "guest-19815" or "realUserId"
    const isAll = url.searchParams.get("all"); // optional, e.g. "?all=1"

    if (portfolioMode) {
      const avatar = "/assets/images/temp.jfif";
      return new Response(
        JSON.stringify(
          isAll === "1" ? { avatars: [avatar], main: 0 } : { avatar }
        ),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { doc, getDoc, collection, getDocs, query, where } = await import("firebase/firestore");
    const { firestore } = await import("@/app/config/firebase");

    // If the ID starts with "guest-", fetch from demochats collection
    if (id && id.startsWith("guest-")) {
      const demoSnap = await getDocs(
        query(
          collection(firestore, "demochats"),
          where("uid", "==", id)
        )
      );

      if (demoSnap.empty) {
        // Fallback to old demoUsers collection for backwards compatibility
        const oldDemoSnap = await getDoc(doc(firestore, "demoUsers", id));
        if (!oldDemoSnap.exists()) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        const demoData = oldDemoSnap.data();
        if (isAll === "1") {
          return new Response(JSON.stringify({ avatars: [demoData.avatar], main: 0 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ avatar: demoData.avatar }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      const demoData = demoSnap.docs[0].data();
      const response = {
        avatar: demoData.avatar,
        isGuest: true,
      };

      // If guest has a creatorId, fetch host's avatar
      if (demoData.creatorId) {
        try {
          const hostPhotoRef = doc(firestore, "photos", demoData.creatorId);
          const hostPhotoDoc = await getDoc(hostPhotoRef);
          if (hostPhotoDoc.exists()) {
            const hostPhotoData = hostPhotoDoc.data();
            const mainHostAvatar = hostPhotoData.avatar?.[parseInt(hostPhotoData.main)];
            if (mainHostAvatar) {
              response.hostAvatar = mainHostAvatar;
            }
          }
        } catch (error) {
          console.warn(`Could not fetch host avatar for guest ${id}:`, error.message);
        }
      }

      if (isAll === "1") {
        return new Response(JSON.stringify({ avatars: [response.avatar], main: 0, ...response }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ avatar: response }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Otherwise, proceed with the existing “photos/{id}” logic

    if (isAll === "1") {
      
      const photoRef = doc(firestore, "photos", id);
      const photoDoc = await getDoc(photoRef);
      // If photos document doesn't exist, return empty avatars array
      // (user just hasn't uploaded any photos yet)
      if (!photoDoc.exists()) {
        return new Response(
          JSON.stringify({ avatars: [], main: 0 }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      const photoData = photoDoc.data();
      return new Response(
        JSON.stringify({ avatars: photoData.avatar || [], main: photoData.main || 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else if (id) {
      
      const photoRef = doc(firestore, "photos", id);
      const photoDoc = await getDoc(photoRef);
      // If photos document doesn't exist, return null/empty (graceful fallback)
      if (!photoDoc.exists()) {
        return new Response(JSON.stringify({ avatar: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const photoData = photoDoc.data();
      const mainAvatar = photoData.avatar?.[parseInt(photoData.main)];
      return new Response(JSON.stringify({ avatar: mainAvatar }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If no ID or invalid, return 400
    return new Response(JSON.stringify({ error: "ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching avatar:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT = async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id"); // e.g. "guest-19815" or "realUserId"
    const body = await req.json();
    const { main } = body;

    if (portfolioMode) {
      return new Response(JSON.stringify({ message: "Preview avatar updated" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { doc, getDoc, updateDoc } = await import("firebase/firestore");
    const { firestore } = await import("@/app/config/firebase");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    if (main === undefined || main === null) {
      return new Response(
        JSON.stringify({ error: "'main' field is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If updating a guest user’s avatar, update demoUsers/{id}.avatar
    if (id.startsWith("guest-")) {
      const demoRef = doc(firestore, "demoUsers", id);
      const demoSnap = await getDoc(demoRef);
      if (!demoSnap.exists()) {
        return new Response(
          JSON.stringify({ error: "Demo user not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // We assume demoUsers/{id}.avatar is a single string; “main” is irrelevant here,
      // but to mirror interface, we could store main index or skip entirely.
      // If you need to support multiple avatars for demoUsers, adjust accordingly.
      // For now, just return an error if someone tries to PUT “main” on a guest.
      return new Response(
        JSON.stringify({
          error: "Cannot update 'main' for a demo user's single avatar",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Otherwise, update the “main” field in photos/{id}
    
    const photoRef = doc(firestore, "photos", id);
    const photoSnap = await getDoc(photoRef);
    if (!photoSnap.exists()) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    await updateDoc(photoRef, { main });

    return new Response(
      JSON.stringify({ message: "Main field updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating main avatar:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
