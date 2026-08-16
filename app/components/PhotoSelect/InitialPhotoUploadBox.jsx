export default function PhotoUploadBox({ photo, onPhotoAdd, onPhotoRemove, isMain, index, onSetMain }) {
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) onPhotoAdd(file);
    };
    return (
        <div
            className="relative aspect-square rounded-2xl group hover:shadow-[0px_4px_10px_rgba(0,0,0,0.5)]" // Removed `overflow-hidden`
            onClick={photo ? onSetMain : undefined} // Call `onSetMain` only when the photo exists
        >
            {photo ? (
                <>
                    <div className="relative w-full h-full overflow-hidden rounded-2xl"> {/* Added a wrapper with overflow-hidden */}
                        {
                            photo.type == "image" ? (
                                <img
                                    loading="lazy"
                                    src={photo.downloadUrl}
                                    alt="profile"
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                            ) : (
                                <video
                                    src={photo.downloadUrl}
                                    className="w-full h-full object-cover cursor-pointer"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            )
                        }
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent the click from triggering `onSetMain`
                            onPhotoRemove();
                        }}
                        className="absolute -top-2 -right-2 w-10 h-10 border-[5px] border-white bg-black  rounded-full flex items-center justify-center text-white"
                    >
                        ×
                    </button>
                    {isMain && (
                        <span className="absolute bottom-2 left-2 px-3 py-1 bg-white rounded-full text-sm opacity-85">
                            Main
                        </span>
                    )}
                </>
            ) : (
                <label className="w-full h-full flex items-center justify-center bg-gray-100 rounded-[20px] cursor-pointer">
                    <input
                        type="file"
                        accept="image/*, video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex w-14 h-14 justify-center items-center gap-[10px] bg-white rounded-full">
                        <img
                            src={"/assets/svgs/elements.svg"}
                            alt="Toggle visibility"
                        />
                    </div>
                </label>
            )}
        </div>
    );
}