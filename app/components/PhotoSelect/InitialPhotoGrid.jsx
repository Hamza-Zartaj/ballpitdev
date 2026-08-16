import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthProvider";
import PhotoUploadBox from "./InitialPhotoUploadBox";

export default function PhotoGrid({
    photos: initialPhotos,
    mainNumber = -1,
    onPhotoAdd,
    onPhotoRemove,
    user_id = null, // Ensure user_id is passed to update the main field
}) {
    const { user, updateUser } = useAuth();
    const [photos, setPhotos] = useState([]); // Local state to manage photos
    const [mainIndex, setMainIndex] = useState(
        mainNumber !== -1 ? mainNumber : sessionStorage.getItem("main")
    );

    // Initialize photos and main index from `sessionStorage` and `initialPhotos`
    useEffect(() => {
        if (initialPhotos) {
            setPhotos(initialPhotos);
        }
        const storedMainIndex = sessionStorage.getItem("main");
        if (storedMainIndex !== null) {
            setMainIndex(Number(storedMainIndex));
        } else {
            sessionStorage.setItem("main", 0);
        }
    }, [initialPhotos]);

    // Function to update the "main" field in Firestore
    const updateMainField = async (userId, mainIdx) => {
        const mainValue = `${userId}_${mainIdx}`; // Construct the new "main" value

        try {
            const response = await fetch(`/api/users?id=${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    main: mainValue, // Send updated "main" field
                }),
            });

            // Check if the response is OK
            if (!response.ok) {
                throw new Error(`Failed to update main field: ${response.statusText}`);
            }

            // Parse the response JSON
            const responseData = await response.json();

            // Update the user context if `updateUser` is available
            if (updateUser) {
                updateUser({
                    main: mainValue,
                });
            }

            // Stop the loading state
        } catch (error) {
            console.error("Error updating main field:", error);
        }
    };

    const handleSetMain = (index) => {
        setMainIndex(index); // Update local state
        sessionStorage.setItem("main", index); // Update session storage

        // Call updateMainField to update the database when the user explicitly sets a new main photo
        if (user_id) {
            updateMainField(user_id, index);
        }
    };

    const handlePhotoRemove = (index) => {
        const updatedPhotos = [...photos];
        updatedPhotos[index] = null; // Remove the photo locally
        // const nextMainIndex = updatedPhotos.findIndex((photo) => photo !== null);
        // const newMainIndex = nextMainIndex !== -1 ? nextMainIndex : 0;
        // const mainValue = `${user_id}_${newMainIndex}`;
       
        // setPhotos(updatedPhotos);
        // if (updateUser) {
        //     updateUser({
        //         main: mainValue, // Update the user context with the new main photo
        //     });
        // }
        // Trigger parent callback to remove photo in Firebase
        onPhotoRemove(index);
    };

    const handlePhotoAdd = (index, file) => {
        const updatedPhotos = [...photos];
        updatedPhotos[index] = file;
        setPhotos(updatedPhotos);

        // If the current main photo is null, set the new photo as the main (default logic)
        if (photos[mainIndex] === undefined || photos[mainIndex] === null) {
            setMainIndex(index);
            sessionStorage.setItem("main", index);
            if (user_id) {
                const mainValue = `${user_id}_${index}`;
                if (updateUser) {
                    updateUser({
                        main: mainValue, // Update the user context with the new main photo
                    });
                    updateMainField(user_id, index);
                }
            }
        }

        // Trigger parent callback to add photo in Firebase
        onPhotoAdd(index, file);
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <PhotoUploadBox
                    key={index}
                    photo={photos[index]}
                    onPhotoAdd={(file) => handlePhotoAdd(index, file)}
                    onPhotoRemove={() => handlePhotoRemove(index)}
                    isMain={mainIndex === index}
                    index={index}
                    onSetMain={() => handleSetMain(index)}
                />
            ))}
        </div>
    );
}