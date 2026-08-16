import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthProvider";
import PhotoUploadBox from "./PhotoUploadBox";

export default function PhotoGrid({
    photos: initialPhotos,
    mainNumber = -1,
    onPhotoAdd,
    onPhotoRemove,
    setLoading,
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
        const mainvalue = String(mainIdx);
        try {
            const response = await fetch(`/api/avatar?id=${userId}`, {
                method: "PUT", // Explicitly set the method to PUT
                headers: {
                    "Content-Type": "application/json", // Specify the content type
                },
                body: JSON.stringify({
                    main: mainvalue, // Pass the new main value as the body
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update main field: ${response.statusText}`);
            }

            const responseData = await response.json();

            setLoading(false);
        } catch (error) {
            console.error("Error updating main field:", error);
            setLoading(false);
        }
    };

    const handleSetMain = (index) => {
        if (sessionStorage.getItem("main") === String(index)) {
            return;
        }
        setLoading(true);
        setMainIndex(index); // Update local state
        sessionStorage.setItem("main", index); // Update session storage

        // Call updateMainField to update the database when the user explicitly sets a new main photo
        if (user_id) {
            updateMainField(user_id, index);
        }
    };

    const handlePhotoRemove = (index) => {
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
                    disableRemove={photos.filter((photo) => photo).length === 1}
                />
            ))}
        </div>
    );
}