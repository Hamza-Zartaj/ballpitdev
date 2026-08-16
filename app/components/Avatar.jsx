// app/components/Avatar.jsx
"use client";
import React, { useEffect, useState } from "react";

const Avatar = ({ src, className }) => {
  const [urlData, setUrlData] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveImmediateSource = (source) => {
    if (typeof source !== "string") return null;
    const trimmed = source.trim();
    if (!trimmed) return null;

    const isHttpUrl = /^https?:\/\//i.test(trimmed);
    const isDataUrl = /^data:image\/.+;base64,/i.test(trimmed);
    const isAssetPath = trimmed.startsWith("/") && !trimmed.startsWith("/api/");

    if (isHttpUrl || isDataUrl || isAssetPath) {
      return {
        type: "image",
        downloadURL: trimmed,
      };
    }
    return null;
  };

  useEffect(() => {
    if (!src) {
      // No src → skip fetch, show fallback immediately
      setLoading(false);
      return;
    }

    const immediate = resolveImmediateSource(src);
    if (immediate) {
      setUrlData(immediate);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAvatar = async () => {
      try {
        const response = await fetch(`/api/avatar?id=${src}`);
        if (response.status === 404) {
          if (isMounted) {
            setUrlData({
              type: "image",
              downloadURL: "/assets/images/temp.jfif",
            });
          }
          return;
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!isMounted) return;

        // Case A: data.avatar is a string URL
        if (typeof data.avatar === "string") {
          setUrlData({
            type: "image",
            downloadURL: data.avatar,
          });
        }
        // Case B: data.avatar is an object like { type, downloadURL }
        else if (
          data.avatar &&
          typeof data.avatar === "object" &&
          data.avatar.type &&
          data.avatar.downloadURL
        ) {
          setUrlData({
            type: data.avatar.type,
            downloadURL: data.avatar.downloadURL,
          });
        }
        // Case C: data has top‐level { type, downloadURL } instead
        else if (data.type && data.downloadURL) {
          setUrlData({
            type: data.type,
            downloadURL: data.downloadURL,
          });
        }
        // Fallback: use a default image
        else {
          setUrlData({
            type: "image",
            downloadURL: "/assets/images/temp.jfif",
          });
        }
      } catch (error) {
        console.error("Error fetching avatar:", error);
        if (isMounted) {
          setUrlData({
            type: "image",
            downloadURL: "/assets/images/temp.jfif",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAvatar();
    return () => {
      isMounted = false;
    };
  }, [src]);

  // While loading, show a small spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#5B49EF]"></div>
      </div>
    );
  }

  // If urlData is still null for some reason, render fallback
  if (!urlData) {
    return (
      <img
        loading="lazy"
        src="/assets/images/temp.jfif"
        alt="Avatar fallback"
        className={className}
      />
    );
  }

  // Render <img> or <video> based on urlData.type
  return urlData.type === "image" ? (
    <img
      loading="lazy"
      src={urlData.downloadURL}
      alt="Avatar"
      className={className}
    />
  ) : (
    <video
      src={urlData.downloadURL}
      className={className}
      autoPlay
      loop
      muted
      playsInline
    />
  );
};

export default Avatar;
