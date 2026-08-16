"use client";
import Image from "next/image";
import * as React from "react";

export default function EditButton({ text, onClick }) {
  return (
    <button
      className="flex flex-col justify-center items-center px-5 py-6 mt-4 w-full text-base font-medium tracking-normal leading-none text-indigo-600 bg-violet-100 max-h-[40px] rounded-[888px]"
      tabIndex={0}
      onClick={onClick}
    >
      <div className="flex items-center">
        <img
          loading="lazy"
          src="/assets/svgs/edit.svg"
          alt=""
          className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square"
        />
        <div className="gap-2 self-stretch px-3 my-auto text-ellipsis">
          {text}
        </div>
      </div>
    </button>
  );
}