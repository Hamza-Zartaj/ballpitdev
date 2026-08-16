"use client";
import Image from "next/image";
import * as React from "react";

export function MenuItem({ icon, title, description, hasArrow, titleColor, className, onClick }) {

  return (
    <div className={`cursor-pointer flex gap-4 w-full bg-white  ${className}`} onClick={onClick}>
      <div className="flex flex-1 shrink gap-6 items-start h-full basis-0 min-w-[240px]">
        <img
          loading="lazy"
          src={icon}
          alt=""
          width="28"
          height="28"
          className="mt-[1vh] object-contain shrink-0 w-6 aspect-square"
        />
        <div className="flex flex-col flex-1 shrink basis-0 min-w-[240px]">
          <div className={`text-lg font-medium tracking-tight leading-none ${titleColor || 'text-black'}`}>
            {title}
          </div>
          <div className="mt-1 text-base tracking-normal text-gray-600 text-ellipsis">
            {description}
          </div>
        </div>
      </div>
      {hasArrow && (
        <Image
          loading="lazy"
          src="/assets/svgs/next.svg"
          alt=""
          width="28"
          height="28"
          className="hover:ring-1 object-contain shrink-0 my-auto w-6 aspect-square"
        />
      )}
    </div>
  );
}