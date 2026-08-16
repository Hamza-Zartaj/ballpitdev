'use client'

import { useEffect, useState } from "react"
const { useContext, createContext } = require("react")
import { useAuth } from "./AuthProvider"
import { getDownloadURL, getMetadata, ref } from "firebase/storage"
import { storage } from "../config/firebase"

const NotificationContext = createContext({})

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth(); // User from AuthProvider
    const [isVisible, setVisible] = useState(false)
    const [shouldFadeOut, setShouldFadeOut] = useState(false); // Controls fade-out effect
    const [avatar, setAvatar] = useState()
    const [gift, setGift] = useState()
    const [content, setContent] = useState('a Rose')
    const [duration, setDuration] = useState(3000)
    const [mediaType, setMediaType] = useState(null);

    const showNotification = ({ avatar1, gift, content }) => {
        if (isVisible) {
            return false; // Prevent multiple notifications from showing simultaneously
        }
        const fetchImage = async (main) => {
            try {
                const response = await fetch(`/api/avatar?id=${main}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })
                let url = await response.json();
                setAvatar(url)
            } catch (error) {
                console.error("Error fetching image URL:", error);
            }
        };
        fetchImage(avatar1);
        setGift(gift);
        setContent(content);
        setDuration(duration || 3000);
        // Show the notification
        setShouldFadeOut(false);
        if (Notification.permission === "granted" && user && user.notificationstate) {
            new Notification("❤️Notifications", {
                body: content,
            });
        }
        // Start fade-out effect after the duration
        const fadeOutTimer = setTimeout(() => {
            setShouldFadeOut(true);
        }, duration || 5000);

        // Completely hide notification after fade-out
        const removeTimer = setTimeout(() => {
            setVisible(false);
        }, duration ? duration + 2000 : 7000);

        // Clear timers if needed
        return () => {
            clearTimeout(fadeOutTimer);
            clearTimeout(removeTimer);
        };
    };
    useEffect(() => {
        if (avatar) {
            setVisible(true);
        }
    }, [avatar])
    return (
        <NotificationContext.Provider value={{ showNotification }}>
            <div className="flex w-full justify-center absolute top-[7rem] z-50">

                {isVisible ?
                    <div
                        className={`flex cursor-pointer w-[80%] bg-Primary-800 px-3 py-3 border border-Primary-500 rounded-[50px] 
        animate-slideInRight transition-opacity duration-[2000ms] ease-out ${shouldFadeOut ? "opacity-0" : "opacity-100"
                            }`}
                        style={{
                            transition: "opacity 2s ease-out", // Smooth fade-out transition
                        }}
                    >

                        {/* Avatar */}
                        {
                            avatar.type == "image" ? (
                                <img
                                    loading="lazy"
                                    src={avatar.downloadURL}
                                    alt="User profile avatar"
                                    style={{ outlineColor: "#efedfd" }}
                                    className="z-[1] object-cover w-[39.23px] h-[39.23px] -mr-2 mt-[2px] outline outline-[5px]  rounded-full"
                                />
                            ) : avatar.type == "video" ? (
                                <video
                                    src={avatar.downloadURL}
                                    style={{ outlineColor: "#efedfd" }}
                                    className="z-[1] object-cover w-[39.23px] h-[39.23px] -mr-2 mt-[2px] outline outline-[5px]  rounded-full"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (<></>)
                        }
                        <img
                            loading="lazy"
                            src={gift}
                            alt="Gift"
                            className="z-[0] object-contain shrink-0 gap-0 self-stretch my-auto aspect-[1.2] w-[51px]"
                        />

                        {/* Content */}
                        <div className="flex flex-col flex-1 shrink self-stretch px-3 my-auto basis-0 min-w-[240px]">
                            <div className="flex flex-col w-full">
                                <div className="text-base font-semibold tracking-tight leading-none text-Primary-500">
                                    {content}
                                </div>
                                <div className="text-sm tracking-normal leading-snug text-indigo-600 opacity-80">
                                    Click to respond
                                </div>
                            </div>
                        </div>

                        {/* Icon */}
                        <img
                            loading="lazy"
                            src="/assets/svgs/next_active.svg"
                            alt=""
                            className="object-contain shrink-0 self-stretch my-auto w-5 aspect-square"
                        />
                    </div>
                    :
                    <></>
                }
            </div>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};