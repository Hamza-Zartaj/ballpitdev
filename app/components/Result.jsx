"use client";
import * as React from "react";

export default function Result({ text, detail }) {
    return (
        <div className="flex  flex-col  overflow-hidden flex-1 justify-center px-6 py-10 mt-[-100px] w-full text-center">
            <div className="flex flex-col mt-24 w-full">
                <img
                    loading="lazy"
                    src="/assets/svgs/search_result.svg"
                    alt=""
                    className="object-contain self-center mt-px max-w-full rounded-none aspect-[1.28] w-[154px]"
                />
                <div className="flex flex-col items-start mt-4 mb-7 justify-center w-full">
                    <div className="self-center text-2xl font-semibold tracking-tight leading-none text-black">
                        {text}
                    </div>
                    <div className="mt-2.5 self-center w-[90%] max-h-[48px] text-lg tracking-normal leading-6 text-gray-600">
                        {detail}
                    </div>
                </div>
            </div>
        </div>
    );
}