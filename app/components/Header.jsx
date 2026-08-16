"use client";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function Header({ text, close = false, routing }) {
  const router = useRouter();
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <div className="flex flex-col px-4 py-[4vh] pb-4 w-full max-w-[528px] bg-white border-b border-solid border-b-zinc-200">
      {
        close === false ? <div className="flex gap-10 justify-between items-center w-full">
          <button
            className="hover:ring-1 flex gap-2.5 justify-center items-center self-stretch p-2 my-auto w-10 min-h-10"
            aria-label="Back"
          >
            <img
              loading="lazy"
              src="/assets/svgs/backbutton.svg"
              alt=""
              className="object-contain self-stretch my-auto w-6 aspect-square"
              onClick={() => routing ? router.push(routing) : router.back()}
            />
          </button>
          <div className="self-stretch my-auto text-xl font-medium font-cabinet tracking-tight leading-tight text-black">
            {text}
          </div>
          <div className="flex shrink-0 gap-2.5 self-stretch my-auto w-10 h-10 bg-white rounded-2xl rotate-[3.141592653589793rad]" />
        </div> : <div className="flex gap-10 justify-between items-center w-full">
          <div className="flex shrink-0 gap-2.5 self-stretch my-auto w-10 h-10 bg-white rounded-2xl rotate-[3.141592653589793rad]" />
          <div className="self-stretch my-auto text-xl font-medium font-cabinet tracking-tight leading-tight text-black">
            {text}
          </div>
          <button
            className="hover:ring-1 flex gap-2.5 justify-center items-center self-stretch p-2 my-auto w-10 min-h-10"
            aria-label="Back"
          >
            <img
              loading="lazy"
              src="/assets/svgs/close.svg"
              alt=""
              className="object-contain self-stretch my-auto w-6 aspect-square"
              onClick={() => routing ? router.push(routing) : router.back()}
            />
          </button>
        </div>
      }
      </div>
    </div>
  );
}
