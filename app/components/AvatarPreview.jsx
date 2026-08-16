"use client";
import React from "react";

const Avatar = ({ mediaType, mediaUrl, className }) => {

  return (
    <>
      {mediaType === "image" ? (
        // Render image
        <img
          loading="lazy"
          src={mediaUrl || "/assets/images/temp.jfif"} // Fallback to a default image if mediaUrl is null
          alt="Avatar"
          className={`${className}`}
        />
      ) : (
        // Render video
        <video
          src={mediaUrl}
          className={`${className}`}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
    </>
  );

};

export default Avatar;
